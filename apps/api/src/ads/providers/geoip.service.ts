import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { AdCampaign } from '../interfaces/ads.types';

export const BRAZILIAN_UFS = new Set([
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
]);

export const UF_TO_STATE_SLUG: Record<string, string> = {
  AC: 'acreano',
  AL: 'alagoano',
  AP: 'amapaense',
  AM: 'amazonense',
  BA: 'baiano',
  CE: 'cearense',
  DF: 'brasiliense',
  ES: 'capixaba',
  GO: 'goiano',
  MA: 'maranhense',
  MT: 'matogrossense',
  MS: 'sulmatogrossense',
  MG: 'mineiro',
  PA: 'paraense',
  PB: 'paraibano',
  PR: 'paranaense',
  PE: 'pernambucano',
  PI: 'piauiense',
  RJ: 'carioca',
  RN: 'potiguar',
  RS: 'gaucho',
  RO: 'rondoniense',
  RR: 'roraimense',
  SC: 'catarinense',
  SP: 'paulista',
  SE: 'sergipano',
  TO: 'tocantinense',
};

export const STATE_SLUG_TO_UF: Record<string, string> = Object.entries(UF_TO_STATE_SLUG).reduce(
  (acc, [uf, slug]) => {
    acc[slug] = uf;
    return acc;
  },
  {} as Record<string, string>,
);

interface CachedGeoResult {
  state: string | null;
  expiresAt: number;
}

@Injectable()
export class GeoIpService {
  private readonly logger = new Logger(GeoIpService.name);

  // Cache em memória de IP -> UF (TTL: 24 horas)
  private readonly ipCache = new Map<string, CachedGeoResult>();
  private readonly MAX_CACHE_ENTRIES = 20000;
  private readonly CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24h
  private readonly NEGATIVE_TTL_MS = 60 * 60 * 1000; // 1h para IPs não resolvidos

  /**
   * Resolve o estado brasileiro (UF de 2 letras) a partir do IP ou de uma dica (hint).
   */
  async resolveState(clientIp?: string, hintState?: string): Promise<string | null> {
    // 1. Se foi passado hint (query param ou header Cloudflare cf-region-code)
    if (hintState) {
      const cleanHint = hintState.trim().toUpperCase();
      if (BRAZILIAN_UFS.has(cleanHint)) {
        return cleanHint;
      }
      const slugLower = hintState.toLowerCase().trim().replace('campeonato_', '');
      if (STATE_SLUG_TO_UF[slugLower]) {
        return STATE_SLUG_TO_UF[slugLower];
      }
    }

    if (!clientIp) return null;

    // Normaliza IP (remove prefixo IPv6 ::ffff: e porta)
    let cleanIp = clientIp.trim();
    if (cleanIp.startsWith('::ffff:')) {
      cleanIp = cleanIp.replace('::ffff:', '');
    }
    if (cleanIp.includes(',')) {
      cleanIp = cleanIp.split(',')[0].trim();
    }
    if (cleanIp.includes(':') && !cleanIp.includes('.')) {
      return null;
    }

    // Ignora IPs privados / locais
    if (this.isPrivateIp(cleanIp)) {
      return null;
    }

    // 2. Consulta cache em memória
    const now = Date.now();
    const cached = this.ipCache.get(cleanIp);
    if (cached && now < cached.expiresAt) {
      return cached.state;
    }

    // 3. Consulta GeoIP externa via ip-api.com com timeout defensivo de 1.2s
    try {
      const response = await axios.get(
        `http://ip-api.com/json/${cleanIp}?fields=status,countryCode,region`,
        { timeout: 1200 },
      );

      const data = response.data;
      let detectedState: string | null = null;

      if (data && data.status === 'success' && data.countryCode === 'BR' && data.region) {
        const uf = String(data.region).toUpperCase().trim();
        if (BRAZILIAN_UFS.has(uf)) {
          detectedState = uf;
        }
      }

      this.setCache(cleanIp, detectedState, detectedState ? this.CACHE_TTL_MS : this.NEGATIVE_TTL_MS);
      return detectedState;
    } catch (err: any) {
      this.logger.debug(`[GeoIpService] Falha silenciosa ao resolver IP ${cleanIp}: ${err.message}`);
      return null;
    }
  }

  /**
   * Detecta para qual estado brasileiro (UF) uma campanha pertence.
   * Analisa destination_url, title, target_apps e target_states com precisão.
   */
  detectCampaignState(campaign: AdCampaign): string | null {
    // 0. Se geo_targeting for falso explicitamente, não tem restrição estadual
    if (campaign.geo_targeting === false) {
      return null;
    }

    // 0.1 Se for campanha explícita do Brasileirão / nacional, não é de estado
    const destUrl = (campaign.destination_url || '').toLowerCase();
    if (destUrl.includes('com.prolaser.futebolbrasileirobr') || destUrl.includes('screwpuzzler') || destUrl.includes('liquidcolor')) {
      return null;
    }

    // 1. target_states explícito (se existir no schema)
    if (campaign.target_states && Array.isArray(campaign.target_states)) {
      const states = campaign.target_states;
      if (states.length > 0 && BRAZILIAN_UFS.has(states[0].toUpperCase())) {
        return states[0].toUpperCase();
      }
    }

    // 2. Por destination_url (ex: com.zapscore.estadualpernambucano ou com.zapscore.campeonatomineiro)
    for (const [slug, uf] of Object.entries(STATE_SLUG_TO_UF)) {
      if (destUrl.includes(`estadual${slug}`) || destUrl.includes(`campeonato${slug}`)) {
        return uf;
      }
    }

    // 3. Por título da campanha (ex: "Pernambucano 2026/27", "Paulistão 2027", "Baianão 2027")
    const titleLower = (campaign.title || '').toLowerCase();
    if (!titleLower.startsWith('brasileir') && !titleLower.startsWith('brasiler')) {
      for (const [slug, uf] of Object.entries(STATE_SLUG_TO_UF)) {
        if (titleLower.includes(slug)) {
          return uf;
        }
      }
      if (titleLower.includes('baianão') || titleLower.includes('baiano')) return 'BA';
      if (titleLower.includes('gauchão') || titleLower.includes('gaucho')) return 'RS';
      if (titleLower.includes('barezão') || titleLower.includes('amazonense')) return 'AM';
      if (titleLower.includes('candangão') || titleLower.includes('brasiliense')) return 'DF';
      if (titleLower.includes('parazão') || titleLower.includes('paraense')) return 'PA';
      if (titleLower.includes('capixabão') || titleLower.includes('capixaba')) return 'ES';
      if (titleLower.includes('goianão') || titleLower.includes('goiano')) return 'GO';
      if (titleLower.includes('paulistão') || titleLower.includes('paulista')) return 'SP';
    }

    // 4. Por target_apps se for específico (<= 3 apps)
    const targetApps = campaign.target_apps || [];
    if (targetApps.length > 0 && targetApps.length <= 3) {
      for (const target of targetApps) {
        const cleanTarget = target.toLowerCase().replace('campeonato_', '').trim();
        if (STATE_SLUG_TO_UF[cleanTarget]) {
          return STATE_SLUG_TO_UF[cleanTarget];
        }
      }
    }

    return null;
  }

  /**
   * Retorna o slug do campeonato estadual a partir da UF (ex: 'PE' -> 'pernambucano')
   */
  getChampionshipSlug(uf: string): string | null {
    return UF_TO_STATE_SLUG[uf.toUpperCase()] || null;
  }

  private setCache(ip: string, state: string | null, ttlMs: number): void {
    if (this.ipCache.size >= this.MAX_CACHE_ENTRIES) {
      let count = 0;
      for (const key of this.ipCache.keys()) {
        this.ipCache.delete(key);
        count++;
        if (count >= 1000) break;
      }
    }
    this.ipCache.set(ip, { state, expiresAt: Date.now() + ttlMs });
  }

  private isPrivateIp(ip: string): boolean {
    if (ip === '127.0.0.1' || ip === 'localhost' || ip === '::1') return true;
    if (ip.startsWith('10.') || ip.startsWith('192.168.')) return true;
    if (ip.startsWith('172.')) {
      const parts = ip.split('.');
      if (parts.length >= 2) {
        const second = parseInt(parts[1], 10);
        if (second >= 16 && second <= 31) return true;
      }
    }
    return false;
  }
}
