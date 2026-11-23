import { Injectable, Logger } from '@nestjs/common';
import { PocketbaseAdsClient } from './providers/pocketbase-ads.client';
import { GeoIpService, STATE_SLUG_TO_UF } from './providers/geoip.service';
import {
  AdCampaign,
  AdPlacement,
  AdStatus,
  AdvertiserMetricsSummary,
  DashboardMetricsResponse,
  PlacementInventoryInfo,
  ServeAdQuery,
  ServeAdResponse,
  UploadedCreativeFile,
} from './interfaces/ads.types';

@Injectable()
export class AdsService {
  private readonly logger = new Logger(AdsService.name);

  // Cache em memória de campanhas ativas (TTL: 60 segundos)
  private activeCampaignsCache: { data: AdCampaign[]; expiresAt: number } | null = null;

  constructor(
    private readonly pbAdsClient: PocketbaseAdsClient,
    private readonly geoIpService: GeoIpService,
  ) {}

  /**
   * Limpa o cache em memória após mutações cadastrais
   */
  private invalidateCache(): void {
    this.activeCampaignsCache = null;
  }

  /**
   * Obtém campanhas ativas com cache em memória (60 segundos)
   */
  private async getCachedActiveCampaigns(): Promise<AdCampaign[]> {
    const now = Date.now();
    if (this.activeCampaignsCache && now < this.activeCampaignsCache.expiresAt) {
      return this.activeCampaignsCache.data;
    }

    const campaigns = await this.pbAdsClient.listActiveCampaigns();
    this.activeCampaignsCache = {
      data: campaigns,
      expiresAt: now + 60 * 1000,
    };
    return campaigns;
  }

  /**
   * Motor de entrega de anúncios (Serving Engine) para os aplicativos Flutter
   * com segmentação regional por GeoIP automática para apps de alcance nacional.
   */
  async serveAd(query: ServeAdQuery): Promise<ServeAdResponse | null> {
    const activeCampaigns = await this.getCachedActiveCampaigns();
    if (!activeCampaigns || activeCampaigns.length === 0) {
      return null;
    }

    const now = new Date();

    // 0. Resolução regional do torcedor (UF brasileira) via IP ou dica (hint/header Cloudflare)
    const userUf = await this.geoIpService.resolveState(query.clientIp, query.state);

    // 1. Filtro base de validade técnica (placement, vigência, capping de impressões e liga)
    const validCampaigns = activeCampaigns.filter((campaign) => {
      // Filtro de Placement
      if (campaign.placement !== query.placement) return false;

      // Filtro de Vigência (início e término)
      if (campaign.start_at) {
        const start = new Date(campaign.start_at);
        if (now < start) return false;
      }
      if (campaign.end_at) {
        const end = new Date(campaign.end_at);
        if (now > end) return false;
      }

      // Filtro de Capping de Impressões
      if (campaign.max_impressions > 0 && campaign.impressions_count >= campaign.max_impressions) {
        return false;
      }

      // Filtro de Liga/Campeonato (se fornecido na query)
      const targetLeagues = campaign.target_leagues || [];
      if (targetLeagues.length > 0 && query.leagueId) {
        const leagueIdNum = Number(query.leagueId);
        if (!targetLeagues.includes(leagueIdNum)) return false;
      }

      return true;
    });

    if (validCampaigns.length === 0) {
      return null;
    }

    const queryApp = (query.app || 'all').toLowerCase().trim();
    const cleanAppSlug = queryApp.replace('campeonato_', '');
    const isNationalApp = ['brasileirao', 'copadobrasil', 'copalibertadores', 'europa', 'all'].includes(queryApp);

    // Helper: verifica se a campanha autorizou este app explicitamente ou através de 'all'
    const isAppTargeted = (campaign: AdCampaign): boolean => {
      const targetApps = campaign.target_apps || ['all'];
      if (targetApps.includes('all')) return true;
      return targetApps.some((target) => {
        const t = target.toLowerCase().trim();
        const cleanT = t.replace('campeonato_', '');
        return (
          t === queryApp ||
          cleanT === cleanAppSlug ||
          `campeonato_${cleanT}` === queryApp ||
          t === cleanAppSlug
        );
      });
    };

    let eligible: AdCampaign[] = [];

    if (isNationalApp) {
      // CASO A: Aplicativo de Alcance Nacional (ex: Brasileirão, Copas, All)
      // 1. Campanhas globais/nacionais autorizadas para este app (ex: Games e anunciantes nacionais)
      const nationalCampaigns = validCampaigns.filter((campaign) => {
        if (!isAppTargeted(campaign)) return false;
        if (campaign.geo_targeting === false) return true;
        if (campaign.geo_targeting === true) return false;
        return this.geoIpService.detectCampaignState(campaign) === null;
      });

      // 2. Campanhas regionais autorizadas para este app direcionadas especificamente para a UF do torcedor (via GeoIP)
      const stateMatches = userUf
        ? validCampaigns.filter((campaign) => {
            if (!isAppTargeted(campaign)) return false;
            if (campaign.geo_targeting === false) return false;
            if (Array.isArray(campaign.target_states) && campaign.target_states.length > 0) {
              return campaign.target_states.map((s) => s.toUpperCase().trim()).includes(userUf);
            }
            return this.geoIpService.detectCampaignState(campaign) === userUf;
          })
        : [];

      // Concorrência justa: Tanto a campanha regional do estado do torcedor quanto as campanhas nacionais/games concorrem no sorteio ponderado!
      eligible = [...stateMatches, ...nationalCampaigns];
    } else {
      // CASO B: Aplicativo Estadual Específico (ex: "pernambucano", "paulista", "mineiro")
      const appUf = STATE_SLUG_TO_UF[cleanAppSlug];

      eligible = validCampaigns.filter((campaign) => {
        // 1. O app precisa estar expressamente autorizado em target_apps (ou 'all')
        if (!isAppTargeted(campaign)) {
          return false;
        }

        // 2. Se a campanha tem geo_targeting ativo para outro estado específico, não deve exibir aqui
        if (campaign.geo_targeting === true) {
          if (Array.isArray(campaign.target_states) && campaign.target_states.length > 0) {
            if (appUf && !campaign.target_states.map((s) => s.toUpperCase().trim()).includes(appUf)) {
              return false;
            }
          } else {
            const campaignState = this.geoIpService.detectCampaignState(campaign);
            if (campaignState && appUf && campaignState !== appUf) {
              return false;
            }
          }
        }

        return true;
      });
    }

    if (eligible.length === 0) {
      return null;
    }

    // Se houver apenas 1 campanha elegível, entrega imediatamente
    let selected: AdCampaign = eligible[0];

    // Se houver múltiplas concorrentes, realiza sorteio ponderado pela prioridade
    if (eligible.length > 1) {
      const tickets: AdCampaign[] = [];
      for (const camp of eligible) {
        const weight = Math.max(1, Math.min(10, camp.priority || 1));
        for (let i = 0; i < weight; i++) {
          tickets.push(camp);
        }
      }
      const randomIndex = Math.floor(Math.random() * tickets.length);
      selected = tickets[randomIndex];
    }

    return {
      id: selected.id,
      title: selected.title,
      advertiser: selected.advertiser,
      placement: selected.placement,
      imageUrl: selected.creative_url || '',
      destinationUrl: selected.destination_url,
      impressionUrl: `/ads/${selected.id}/impression`,
      clickUrl: `/ads/${selected.id}/click`,
      detectedState: userUf || undefined,
    };
  }

  /**
   * Registra impressão visual de forma assíncrona
   */
  async recordImpression(campaignId: string, appSlug: string, leagueId?: number): Promise<void> {
    await this.pbAdsClient.recordImpression(campaignId, appSlug, leagueId);
  }

  /**
   * Registra clique e retorna URL de destino
   */
  async recordClick(campaignId: string, appSlug: string, leagueId?: number): Promise<string> {
    const campaign = await this.pbAdsClient.getCampaignById(campaignId);
    await this.pbAdsClient.recordClick(campaignId, appSlug, leagueId);
    return campaign?.destination_url || 'https://zapscore.com.br';
  }

  /**
   * Retorna o Mapa de Inventário e status do Google AdMob
   */
  async getInventoryMap(): Promise<PlacementInventoryInfo[]> {
    const activeCampaigns = await this.getCachedActiveCampaigns();

    const countByPlacement = (placement: AdPlacement) =>
      activeCampaigns.filter((c) => c.placement === placement).length;

    return [
      {
        placement: 'header_sponsor',
        name: 'Topo da Tabela / Oferecimento',
        admobStatus: 'free',
        recommendedSize: '640 x 120 px',
        aspectRatio: '16:3 (ou Logo 300x80)',
        description:
          'Card nobre posicionado no topo da tabela e tela inicial ("Paulistão é um oferecimento de [Marca]"). 100% Livre de AdMob. Espaço nobre exclusivo.',
        activeCampaignsCount: countByPlacement('header_sponsor'),
      },
      {
        placement: 'popup_launch',
        name: 'Pop-up / Modal de Abertura',
        admobStatus: 'free',
        recommendedSize: '600 x 600 px',
        aspectRatio: '1:1 (ou 1080x1350 4:5)',
        description:
          'Modal de boas-vindas exibido 1x ao dia por torcedor ao abrir o aplicativo. 100% Livre de AdMob. Alta conversão para patrocínios pontuais.',
        activeCampaignsCount: countByPlacement('popup_launch'),
      },
      {
        placement: 'native_match_card',
        name: 'Card Nativo no Feed de Jogos',
        admobStatus: 'free',
        recommendedSize: '600 x 150 px',
        aspectRatio: '4:1 (Retangular Feed)',
        description:
          'Banner retangular harmonioso posicionado entre as partidas da rodada. 100% Livre de AdMob. Excelente para casas de apostas e patrocinadores locais.',
        activeCampaignsCount: countByPlacement('native_match_card'),
      },
      {
        placement: 'banner_bottom',
        name: 'Banner Fixo de Rodapé',
        admobStatus: 'hybrid',
        recommendedSize: '640 x 100 px',
        aspectRatio: '32:5 (Padrão Mobile)',
        description:
          'Local clássico onde o Google AdMob opera. O House Ad atua como Fallback automático quando o AdMob falhar, ou como Patrocínio Master exclusivo.',
        activeCampaignsCount: countByPlacement('banner_bottom'),
      },
      {
        placement: 'native_news_feed',
        name: 'Card no Feed de Notícias',
        admobStatus: 'hybrid',
        recommendedSize: '600 x 300 px',
        aspectRatio: '2:1 (Banner de Conteúdo)',
        description:
          'Banner inline no feed de notícias a cada 3 matérias. Híbrido com o AdMob nativo para campanhas com apelo editorial.',
        activeCampaignsCount: countByPlacement('native_news_feed'),
      },
    ];
  }

  /**
   * Consolida métricas executivas no Dashboard (por campanha e por anunciante)
   */
  async getDashboardMetrics(): Promise<DashboardMetricsResponse> {
    const allCampaigns = await this.pbAdsClient.listAllCampaigns();

    let totalImpressions = 0;
    let totalClicks = 0;
    let activeCampaignsCount = 0;

    const advertiserMap = new Map<
      string,
      { campaignsCount: number; totalImpressions: number; totalClicks: number; activeCampaigns: number }
    >();

    for (const c of allCampaigns) {
      totalImpressions += c.impressions_count;
      totalClicks += c.clicks_count;
      if (c.status === 'active') activeCampaignsCount++;

      const advKey = c.advertiser?.trim() || 'Sem Anunciante Declarado';
      const existing = advertiserMap.get(advKey) || {
        campaignsCount: 0,
        totalImpressions: 0,
        totalClicks: 0,
        activeCampaigns: 0,
      };

      existing.campaignsCount += 1;
      existing.totalImpressions += c.impressions_count;
      existing.totalClicks += c.clicks_count;
      if (c.status === 'active') existing.activeCampaigns += 1;

      advertiserMap.set(advKey, existing);
    }

    const averageCtr =
      totalImpressions > 0 ? Number(((totalClicks / totalImpressions) * 100).toFixed(2)) : 0;

    const byAdvertiser: AdvertiserMetricsSummary[] = Array.from(advertiserMap.entries()).map(
      ([advertiser, stats]) => ({
        advertiser,
        campaignsCount: stats.campaignsCount,
        totalImpressions: stats.totalImpressions,
        totalClicks: stats.totalClicks,
        ctr:
          stats.totalImpressions > 0
            ? Number(((stats.totalClicks / stats.totalImpressions) * 100).toFixed(2))
            : 0,
        activeCampaigns: stats.activeCampaigns,
      }),
    );

    // Ordena anunciantes por volume de impressões entregues
    byAdvertiser.sort((a, b) => b.totalImpressions - a.totalImpressions);

    return {
      totalImpressions,
      totalClicks,
      averageCtr,
      activeCampaignsCount,
      advertisersCount: byAdvertiser.length,
      byAdvertiser,
      recentCampaigns: allCampaigns.slice(0, 10),
    };
  }

  // Operações de Gestão Cadastral
  async listCampaigns(params?: { status?: string; advertiser?: string; placement?: string }) {
    return this.pbAdsClient.listAllCampaigns(params);
  }

  async getCampaign(id: string) {
    return this.pbAdsClient.getCampaignById(id);
  }

  async createCampaign(payload: any, file?: UploadedCreativeFile) {
    const res = await this.pbAdsClient.createCampaign(payload, file);
    this.invalidateCache();
    return res;
  }

  async updateCampaign(id: string, payload: any, file?: UploadedCreativeFile) {
    const res = await this.pbAdsClient.updateCampaign(id, payload, file);
    this.invalidateCache();
    return res;
  }

  async updateStatus(id: string, status: AdStatus) {
    const res = await this.pbAdsClient.updateCampaignStatus(id, status);
    this.invalidateCache();
    return res;
  }

  async deleteCampaign(id: string) {
    const res = await this.pbAdsClient.deleteCampaign(id);
    this.invalidateCache();
    return res;
  }
}
