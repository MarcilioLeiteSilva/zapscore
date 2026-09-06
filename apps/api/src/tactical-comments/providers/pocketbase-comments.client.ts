import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { FixtureCommentRecord, TacticalPromptConfig } from '../interfaces/tactical-comments.types';

@Injectable()
export class PocketbaseCommentsClient {
  private readonly logger = new Logger(PocketbaseCommentsClient.name);

  private readonly baseUrl: string;
  private readonly email: string;
  private readonly password: string;

  private authToken: string | null = null;
  private tokenExpiresAt = 0;

  // Cache em memória simples para leituras repetidas da mesma partida (TTL: 15 segundos)
  private readonly readCache = new Map<number, { data: FixtureCommentRecord[]; expiresAt: number }>();
  private cachedConfig: { data: TacticalPromptConfig; expiresAt: number } | null = null;

  constructor(private readonly configService: ConfigService) {
    this.baseUrl =
      this.configService.get<string>('POCKETBASE_COMMENTS_URL') ||
      'https://zapscore-pocketbase-comentarios.gtalg3.easypanel.host';
    this.email =
      this.configService.get<string>('POCKETBASE_COMMENTS_EMAIL') ||
      'prolaser2005@hotmail.com';
    this.password =
      this.configService.get<string>('POCKETBASE_COMMENTS_PASSWORD') ||
      'Cascavel@#01';
  }

  /**
   * Autenticação de superuser no PocketBase com cache de token (2h)
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
        { timeout: 7000 },
      );

      this.authToken = response.data?.token || null;
      this.tokenExpiresAt = now + 2 * 60 * 60 * 1000;
      return this.authToken;
    } catch (err: any) {
      this.logger.warn(`[PocketBase Comentários] Falha ao autenticar superuser: ${err.message}`);
      return null;
    }
  }

  /**
   * Busca comentários de uma partida ordenados cronologicamente (com cache em memória)
   */
  async getCommentsByFixture(fixtureId: number): Promise<FixtureCommentRecord[]> {
    const now = Date.now();
    const cached = this.readCache.get(fixtureId);
    if (cached && now < cached.expiresAt) {
      return cached.data;
    }

    try {
      const url = `${this.baseUrl}/api/collections/fixture_comments/records`;
      const response = await axios.get(url, {
        params: {
          filter: `fixture_id=${fixtureId}`,
          sort: 'minute,id',
          perPage: 50,
        },
        timeout: 6000,
      });

      const items: FixtureCommentRecord[] = (response.data?.items || []).map((item: any) => ({
        id: item.id,
        fixture_id: item.fixture_id,
        league_id: item.league_id,
        minute: item.minute,
        phase: item.phase,
        title: item.title,
        comment: item.comment,
        sentiment: item.sentiment,
        stats_snapshot: item.stats_snapshot,
        created: item.created,
        updated: item.updated,
      }));

      // Salva no cache por 15 segundos
      this.readCache.set(fixtureId, {
        data: items,
        expiresAt: now + 15000,
      });

      return items;
    } catch (err: any) {
      this.logger.warn(
        `[PocketBase Comentários] Falha ao listar comentários para fixture ${fixtureId}: ${err.message}`,
      );
      return cached?.data || [];
    }
  }

  /**
   * Salva um comentário tático na collection `fixture_comments`
   */
  async saveComment(comment: FixtureCommentRecord): Promise<FixtureCommentRecord | null> {
    const token = await this.getAuthToken();
    if (!token) {
      this.logger.error('[PocketBase Comentários] Não foi possível salvar comentário: sem token.');
      return null;
    }

    try {
      const url = `${this.baseUrl}/api/collections/fixture_comments/records`;
      const response = await axios.post(
        url,
        {
          fixture_id: comment.fixture_id,
          league_id: comment.league_id,
          minute: comment.minute ?? null,
          phase: comment.phase,
          title: comment.title,
          comment: comment.comment,
          sentiment: comment.sentiment || 'EQUILIBRADO',
          stats_snapshot: comment.stats_snapshot || null,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: token,
          },
          timeout: 8000,
        },
      );

      // Invalida o cache desta partida para refletir imediatamente
      this.readCache.delete(comment.fixture_id);

      this.logger.log(
        `[PocketBase Comentários] ✅ Comentário [${comment.phase}] salvo com sucesso para fixture ${comment.fixture_id} (Record: ${response.data?.id})`,
      );

      return {
        id: response.data?.id,
        fixture_id: response.data?.fixture_id,
        league_id: response.data?.league_id,
        minute: response.data?.minute,
        phase: response.data?.phase,
        title: response.data?.title,
        comment: response.data?.comment,
        sentiment: response.data?.sentiment,
        stats_snapshot: response.data?.stats_snapshot,
        created: response.data?.created,
        updated: response.data?.updated,
      };
    } catch (err: any) {
      this.logger.error(
        `[PocketBase Comentários] Erro ao gravar comentário para fixture ${comment.fixture_id}: ${err.message}`,
      );
      return null;
    }
  }

  /**
   * Obtém a configuração ativa de calibração do prompt (com cache de 60s)
   */
  async getPromptConfig(): Promise<TacticalPromptConfig> {
    const now = Date.now();
    if (this.cachedConfig && now < this.cachedConfig.expiresAt) {
      return this.cachedConfig.data;
    }

    const defaultConfig: TacticalPromptConfig = {
      coach_vs_fan: 50,
      casualness: 60,
      live_length: 'SHORT',
      pause_length: 'DEEP',
      focus_highlights: true,
      focus_table_impact: true,
      focus_substitutions: true,
      enable_crawl4ai: true,
      crawl_sources: 'ge.globo.com,lance.com.br,uol.com.br',
      custom_rules: 'Obedecer rigorosamente ao idioma sem estrangeirismos em inglês. Usar expressões naturais do futebol brasileiro.',
    };

    try {
      const url = `${this.baseUrl}/api/collections/tactical_prompt_config/records?limit=1`;
      const response = await axios.get(url, { timeout: 6000 });
      const item = response.data?.items?.[0];
      if (item) {
        const config: TacticalPromptConfig = {
          id: item.id,
          coach_vs_fan: item.coach_vs_fan ?? 50,
          casualness: item.casualness ?? 60,
          live_length: item.live_length || 'SHORT',
          pause_length: item.pause_length || 'DEEP',
          focus_highlights: item.focus_highlights ?? true,
          focus_table_impact: item.focus_table_impact ?? true,
          focus_substitutions: item.focus_substitutions ?? true,
          enable_crawl4ai: item.enable_crawl4ai ?? true,
          crawl_sources: item.crawl_sources || 'ge.globo.com,lance.com.br,uol.com.br',
          custom_rules: item.custom_rules || '',
        };
        this.cachedConfig = { data: config, expiresAt: now + 60000 };
        return config;
      }
    } catch (err: any) {
      this.logger.warn(`[PocketBase Comentários] Falha ao carregar prompt config: ${err.message}. Usando padrão.`);
    }

    return defaultConfig;
  }

  /**
   * Atualiza a configuração de calibração do prompt
   */
  async savePromptConfig(config: Partial<TacticalPromptConfig>): Promise<TacticalPromptConfig | null> {
    const token = await this.getAuthToken();
    if (!token) {
      this.logger.error('[PocketBase Comentários] Sem token para salvar prompt config.');
      return null;
    }

    try {
      const existing = await this.getPromptConfig();
      const payload = {
        coach_vs_fan: config.coach_vs_fan ?? existing.coach_vs_fan,
        casualness: config.casualness ?? existing.casualness,
        live_length: config.live_length || existing.live_length,
        pause_length: config.pause_length || existing.pause_length,
        focus_highlights: config.focus_highlights !== undefined ? config.focus_highlights : existing.focus_highlights,
        focus_table_impact: config.focus_table_impact !== undefined ? config.focus_table_impact : existing.focus_table_impact,
        focus_substitutions: config.focus_substitutions !== undefined ? config.focus_substitutions : existing.focus_substitutions,
        enable_crawl4ai: config.enable_crawl4ai !== undefined ? config.enable_crawl4ai : existing.enable_crawl4ai,
        crawl_sources: config.crawl_sources !== undefined ? config.crawl_sources : existing.crawl_sources,
        custom_rules: config.custom_rules !== undefined ? config.custom_rules : existing.custom_rules,
      };

      let res: any;
      if (existing.id) {
        const url = `${this.baseUrl}/api/collections/tactical_prompt_config/records/${existing.id}`;
        res = await axios.patch(url, payload, {
          headers: { 'Content-Type': 'application/json', Authorization: token },
          timeout: 8000,
        });
      } else {
        const url = `${this.baseUrl}/api/collections/tactical_prompt_config/records`;
        res = await axios.post(url, payload, {
          headers: { 'Content-Type': 'application/json', Authorization: token },
          timeout: 8000,
        });
      }

      const updated: TacticalPromptConfig = {
        id: res.data?.id,
        ...payload,
      };

      this.cachedConfig = { data: updated, expiresAt: Date.now() + 60000 };
      this.logger.log('[PocketBase Comentários] ✅ Calibração do prompt salva com sucesso.');
      return updated;
    } catch (err: any) {
      this.logger.error(`[PocketBase Comentários] Erro ao salvar prompt config: ${err.message}`);
      return null;
    }
  }
}
