import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { AdCampaign, AdPlacement, AdStatus, UploadedCreativeFile } from '../interfaces/ads.types';

@Injectable()
export class PocketbaseAdsClient {
  private readonly logger = new Logger(PocketbaseAdsClient.name);

  private readonly baseUrl: string;
  private readonly email: string;
  private readonly password: string;

  private authToken: string | null = null;
  private tokenExpiresAt = 0;

  constructor(private readonly configService: ConfigService) {
    this.baseUrl =
      this.configService.get<string>('POCKETBASE_ADS_URL') ||
      'https://zapscore-pocketbase-houseads.gtalg3.easypanel.host';
    this.email =
      this.configService.get<string>('POCKETBASE_ADS_EMAIL') ||
      'prolaser2005@hotmail.com';
    this.password =
      this.configService.get<string>('POCKETBASE_ADS_PASSWORD') ||
      'Cascavel@#01';
  }

  /**
   * Obtém token de superuser autenticado com cache em memória (2h)
   */
  private async getAuthToken(): Promise<string | null> {
    const now = Date.now();
    if (this.authToken && now < this.tokenExpiresAt - 60000) {
      return this.authToken;
    }

    try {
      const url = `${this.baseUrl}/api/collections/_superusers/auth-with-password`;
      const response = await axios.post(
        url,
        {
          identity: this.email,
          password: this.password,
        },
        { timeout: 8000 },
      );

      this.authToken = response.data?.token || null;
      this.tokenExpiresAt = now + 2 * 60 * 60 * 1000;
      return this.authToken;
    } catch (err: any) {
      this.logger.warn(`[PocketBase HouseAds] Falha ao autenticar superuser: ${err.message}`);
      return null;
    }
  }

  /**
   * Monta a URL pública do criativo hospedado na CDN do PocketBase
   */
  getCreativeUrl(recordId: string, filename: string): string {
    if (!filename) return '';
    return `${this.baseUrl}/api/files/ads_campaigns/${recordId}/${filename}`;
  }

  /**
   * Transforma registro bruto do PocketBase na entidade AdCampaign
   */
  private mapRecordToCampaign(record: any): AdCampaign {
    return {
      id: record.id,
      title: record.title || '',
      advertiser: record.advertiser || '',
      placement: record.placement as AdPlacement,
      target_apps: Array.isArray(record.target_apps)
        ? record.target_apps
        : typeof record.target_apps === 'string' && record.target_apps.trim() !== ''
        ? JSON.parse(record.target_apps)
        : ['all'],
      target_leagues: Array.isArray(record.target_leagues)
        ? record.target_leagues
        : typeof record.target_leagues === 'string' && record.target_leagues.trim() !== ''
        ? JSON.parse(record.target_leagues)
        : [],
      creative_image: record.creative_image || '',
      creative_url: record.creative_image
        ? this.getCreativeUrl(record.id, record.creative_image)
        : '',
      destination_url: record.destination_url || '',
      start_at: record.start_at || '',
      end_at: record.end_at || '',
      priority: Number(record.priority) || 1,
      status: (record.status as AdStatus) || 'draft',
      max_impressions: Number(record.max_impressions) || 0,
      impressions_count: Number(record.impressions_count) || 0,
      clicks_count: Number(record.clicks_count) || 0,
      created: record.created,
      updated: record.updated,
    };
  }

  /**
   * Lista todas as campanhas ativas para atendimento do motor de serving
   */
  async listActiveCampaigns(): Promise<AdCampaign[]> {
    try {
      const token = await this.getAuthToken();
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = token;

      const url = `${this.baseUrl}/api/collections/ads_campaigns/records?filter=(status='active')&perPage=100`;
      const response = await axios.get(url, { headers, timeout: 5000 });
      const items = response.data?.items || [];
      return items.map((r: any) => this.mapRecordToCampaign(r));
    } catch (err: any) {
      this.logger.error(`[PocketBase HouseAds] Falha ao listar campanhas ativas: ${err.message}`);
      return [];
    }
  }

  /**
   * Lista campanhas com filtros administrativos
   */
  async listAllCampaigns(params?: {
    status?: string;
    advertiser?: string;
    placement?: string;
  }): Promise<AdCampaign[]> {
    try {
      const token = await this.getAuthToken();
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = token;

      const filters: string[] = [];
      if (params?.status) filters.push(`status='${params.status}'`);
      if (params?.advertiser) filters.push(`advertiser~'${params.advertiser}'`);
      if (params?.placement) filters.push(`placement='${params.placement}'`);

      const filterParam = filters.length > 0 ? `&filter=(${filters.join('&&')})` : '';
      const url = `${this.baseUrl}/api/collections/ads_campaigns/records?perPage=100&sort=-id${filterParam}`;

      const response = await axios.get(url, { headers, timeout: 8000 });
      const items = response.data?.items || [];
      return items.map((r: any) => this.mapRecordToCampaign(r));
    } catch (err: any) {
      this.logger.error(`[PocketBase HouseAds] Falha ao listar campanhas: ${err.message}`);
      return [];
    }
  }

  /**
   * Obtém detalhes de uma campanha específica
   */
  async getCampaignById(id: string): Promise<AdCampaign | null> {
    try {
      const token = await this.getAuthToken();
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = token;

      const url = `${this.baseUrl}/api/collections/ads_campaigns/records/${id}`;
      const response = await axios.get(url, { headers, timeout: 5000 });
      return this.mapRecordToCampaign(response.data);
    } catch (err: any) {
      this.logger.warn(`[PocketBase HouseAds] Campanha ${id} não encontrada: ${err.message}`);
      return null;
    }
  }

  /**
   * Cria nova campanha (suportando upload de imagem via FormData)
   */
  async createCampaign(payload: any, file?: UploadedCreativeFile): Promise<AdCampaign | null> {
    try {
      const token = await this.getAuthToken();
      if (!token) throw new Error('Não autenticado como superuser.');

      const formData = new FormData();
      formData.append('title', payload.title || 'Nova Campanha');
      formData.append('advertiser', payload.advertiser || '');
      formData.append('placement', payload.placement || 'banner_bottom');
      formData.append('destination_url', payload.destination_url || 'https://zapscore.com.br');
      formData.append('priority', String(payload.priority ?? 1));
      formData.append('status', payload.status || 'draft');
      formData.append('max_impressions', String(payload.max_impressions ?? 0));
      formData.append('impressions_count', '0');
      formData.append('clicks_count', '0');

      if (payload.start_at) formData.append('start_at', payload.start_at);
      if (payload.end_at) formData.append('end_at', payload.end_at);

      const targetApps = Array.isArray(payload.target_apps)
        ? payload.target_apps
        : ['all'];
      formData.append('target_apps', JSON.stringify(targetApps));

      const targetLeagues = Array.isArray(payload.target_leagues)
        ? payload.target_leagues
        : [];
      formData.append('target_leagues', JSON.stringify(targetLeagues));

      if (file && file.buffer) {
        const blob = new Blob([new Uint8Array(file.buffer)], { type: file.mimetype });
        formData.append('creative_image', blob, file.originalname);
      }

      const url = `${this.baseUrl}/api/collections/ads_campaigns/records`;
      const response = await axios.post(url, formData, {
        headers: {
          Authorization: token,
        },
        timeout: 15000,
      });

      this.logger.log(`[PocketBase HouseAds] ✅ Campanha criada com sucesso: ${response.data.id}`);
      return this.mapRecordToCampaign(response.data);
    } catch (err: any) {
      this.logger.error(`[PocketBase HouseAds] Erro ao criar campanha: ${err.response?.data ? JSON.stringify(err.response.data) : err.message}`);
      throw err;
    }
  }

  /**
   * Atualiza dados de uma campanha existente
   */
  async updateCampaign(id: string, payload: any, file?: UploadedCreativeFile): Promise<AdCampaign | null> {
    try {
      const token = await this.getAuthToken();
      if (!token) throw new Error('Não autenticado como superuser.');

      const formData = new FormData();
      if (payload.title !== undefined) formData.append('title', payload.title);
      if (payload.advertiser !== undefined) formData.append('advertiser', payload.advertiser);
      if (payload.placement !== undefined) formData.append('placement', payload.placement);
      if (payload.destination_url !== undefined) formData.append('destination_url', payload.destination_url);
      if (payload.priority !== undefined) formData.append('priority', String(payload.priority));
      if (payload.status !== undefined) formData.append('status', payload.status);
      if (payload.max_impressions !== undefined) formData.append('max_impressions', String(payload.max_impressions));
      if (payload.start_at !== undefined) formData.append('start_at', payload.start_at);
      if (payload.end_at !== undefined) formData.append('end_at', payload.end_at);

      if (payload.target_apps !== undefined) {
        formData.append('target_apps', JSON.stringify(payload.target_apps));
      }
      if (payload.target_leagues !== undefined) {
        formData.append('target_leagues', JSON.stringify(payload.target_leagues));
      }

      if (file && file.buffer) {
        const blob = new Blob([new Uint8Array(file.buffer)], { type: file.mimetype });
        formData.append('creative_image', blob, file.originalname);
      }

      const url = `${this.baseUrl}/api/collections/ads_campaigns/records/${id}`;
      const response = await axios.patch(url, formData, {
        headers: {
          Authorization: token,
        },
        timeout: 15000,
      });

      this.logger.log(`[PocketBase HouseAds] ✅ Campanha ${id} atualizada.`);
      return this.mapRecordToCampaign(response.data);
    } catch (err: any) {
      this.logger.error(`[PocketBase HouseAds] Erro ao atualizar campanha ${id}: ${err.message}`);
      throw err;
    }
  }

  /**
   * Altera status rapidamente (ex: ativar/pausar)
   */
  async updateCampaignStatus(id: string, status: AdStatus): Promise<boolean> {
    try {
      const token = await this.getAuthToken();
      if (!token) return false;

      const url = `${this.baseUrl}/api/collections/ads_campaigns/records/${id}`;
      await axios.patch(
        url,
        { status },
        {
          headers: { Authorization: token },
          timeout: 5000,
        },
      );
      return true;
    } catch (err: any) {
      this.logger.error(`[PocketBase HouseAds] Erro ao alterar status da campanha ${id}: ${err.message}`);
      return false;
    }
  }

  /**
   * Exclui uma campanha
   */
  async deleteCampaign(id: string): Promise<boolean> {
    try {
      const token = await this.getAuthToken();
      if (!token) return false;

      const url = `${this.baseUrl}/api/collections/ads_campaigns/records/${id}`;
      await axios.delete(url, {
        headers: { Authorization: token },
        timeout: 5000,
      });
      this.logger.log(`[PocketBase HouseAds] 🗑️ Campanha ${id} excluída.`);
      return true;
    } catch (err: any) {
      this.logger.error(`[PocketBase HouseAds] Erro ao excluir campanha ${id}: ${err.message}`);
      return false;
    }
  }

  /**
   * Registra visualização (impressão) de forma atômica
   */
  async recordImpression(campaignId: string, appSlug: string, leagueId?: number): Promise<void> {
    try {
      const token = await this.getAuthToken();
      if (!token) return;

      // 1. Grava telemetria fina em ads_stats
      const statsUrl = `${this.baseUrl}/api/collections/ads_stats/records`;
      axios.post(
        statsUrl,
        {
          campaign_id: campaignId,
          event_type: 'impression',
          app_slug: appSlug || 'unknown',
          league_id: leagueId ? Number(leagueId) : null,
          timestamp: new Date().toISOString(),
        },
        { headers: { Authorization: token }, timeout: 3000 },
      ).catch(() => {});

      // 2. Incrementa contador acumulado da campanha (+1)
      const campaignUrl = `${this.baseUrl}/api/collections/ads_campaigns/records/${campaignId}`;
      axios.patch(
        campaignUrl,
        { 'impressions_count+': 1 },
        { headers: { Authorization: token }, timeout: 3000 },
      ).catch(() => {});
    } catch (err: any) {
      this.logger.warn(`[PocketBase HouseAds] Erro ao registrar impressão: ${err.message}`);
    }
  }

  /**
   * Registra clique de forma atômica
   */
  async recordClick(campaignId: string, appSlug: string, leagueId?: number): Promise<void> {
    try {
      const token = await this.getAuthToken();
      if (!token) return;

      // 1. Grava telemetria fina em ads_stats
      const statsUrl = `${this.baseUrl}/api/collections/ads_stats/records`;
      axios.post(
        statsUrl,
        {
          campaign_id: campaignId,
          event_type: 'click',
          app_slug: appSlug || 'unknown',
          league_id: leagueId ? Number(leagueId) : null,
          timestamp: new Date().toISOString(),
        },
        { headers: { Authorization: token }, timeout: 3000 },
      ).catch(() => {});

      // 2. Incrementa contador acumulado de cliques (+1)
      const campaignUrl = `${this.baseUrl}/api/collections/ads_campaigns/records/${campaignId}`;
      axios.patch(
        campaignUrl,
        { 'clicks_count+': 1 },
        { headers: { Authorization: token }, timeout: 3000 },
      ).catch(() => {});
    } catch (err: any) {
      this.logger.warn(`[PocketBase HouseAds] Erro ao registrar clique: ${err.message}`);
    }
  }
}
