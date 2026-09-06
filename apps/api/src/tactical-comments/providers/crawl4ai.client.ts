import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

export interface CrawlSyncOptions {
  timeoutMs?: number;
  sessionId?: string;
  cssSelector?: string;
  waitFor?: string;
}

@Injectable()
export class Crawl4aiClient {
  private readonly logger = new Logger(Crawl4aiClient.name);

  private readonly baseUrl: string;
  private readonly token: string;

  constructor(private readonly configService: ConfigService) {
    this.baseUrl =
      this.configService.get<string>('CRAWL4AI_URL') ||
      'https://zapscore-crwal4ai.gtalg3.easypanel.host';
    this.token =
      this.configService.get<string>('CRAWL4AI_API_TOKEN') ||
      '4084320bd0f74f01167b0067afeb4c42dbc1139e416779a9397ee38271dbc95e';
  }

  /**
   * Executa extração síncrona de uma URL retornando Markdown limpo
   */
  async crawlSync(
    url: string,
    options?: CrawlSyncOptions | number,
  ): Promise<string | null> {
    if (!url || !url.startsWith('http')) {
      return null;
    }

    const opts: CrawlSyncOptions =
      typeof options === 'number' ? { timeoutMs: options } : options || {};
    const timeoutMs = opts.timeoutMs || 10000;

    const payload: Record<string, any> = {
      urls: url,
      priority: 10,
    };

    if (opts.sessionId) {
      payload.session_id = opts.sessionId;
    }
    if (opts.cssSelector) {
      payload.css_selector = opts.cssSelector;
    }
    if (opts.waitFor) {
      payload.wait_for = opts.waitFor;
    }

    try {
      const response = await axios.post(
        `${this.baseUrl}/crawl_sync`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.token}`,
          },
          timeout: timeoutMs,
        },
      );

      const result = response.data?.result;
      if (result?.markdown) {
        this.logger.log(
          `[Crawl4AI] ✅ Extração com sucesso de ${url} (${result.markdown.length} caracteres)${opts.sessionId ? ` [Session: ${opts.sessionId}]` : ''}`,
        );
        return result.markdown;
      }

      if (Array.isArray(response.data?.results) && response.data.results[0]?.markdown) {
        return response.data.results[0].markdown;
      }

      return null;
    } catch (err: any) {
      this.logger.warn(
        `[Crawl4AI] Falha na extração de ${url}: ${err.message} (Fallback ativado)`,
      );
      return null;
    }
  }

  /**
   * Busca e descobre automaticamente a URL de cobertura da partida nos portais cadastrados
   * Diferencia a busca entre Pré-Jogo (notícia/escalações) e Ao Vivo (tempo real lance a lance)
   */
  async discoverMatchLiveUrl(
    homeTeam: string,
    awayTeam: string,
    sources: string[] = ['ge.globo.com'],
    isLive = false,
  ): Promise<string | null> {
    try {
      const cleanHome = homeTeam.replace(/(EC|FC|SC|CR|SE|AC)$/i, '').trim();
      const cleanAway = awayTeam.replace(/(EC|FC|SC|CR|SE|AC)$/i, '').trim();

      const sourceSite = sources[0] || 'ge.globo.com';
      const liveKeyword = isLive ? 'tempo real lance a lance' : 'onde assistir escalações';
      const query = `"${cleanHome}" "${cleanAway}" ${liveKeyword} site:${sourceSite}`;
      const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;

      const response = await axios.get(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
        timeout: 5000,
      });

      const html = response.data || '';
      const uddgMatches = (html.match(/uddg=([^&"]+)/g) || []) as string[];
      const links = uddgMatches.map((m: string) => decodeURIComponent(m.replace('uddg=', '')));

      // Se a partida está AO VIVO, prioriza estritamente páginas de tempo-real / ao-vivo
      if (isLive) {
        const liveMatchUrl = links.find(
          (l: string) =>
            sources.some((s) => l.includes(s)) &&
            (l.includes('tempo-real') || l.includes('ao-vivo')),
        );
        if (liveMatchUrl) {
          this.logger.log(
            `[Crawl4AI Discovery] ⚡ URL de TEMPO REAL encontrada para ${homeTeam} x ${awayTeam}: ${liveMatchUrl}`,
          );
          return liveMatchUrl;
        }
      }

      // Prioriza links de jogo, tempo-real ou notícia do portal
      const matchUrl = links.find(
        (l: string) =>
          sources.some((s) => l.includes(s)) &&
          (l.includes('/jogo/') || l.includes('tempo-real') || l.includes('ao-vivo') || l.includes('/noticia/')),
      );

      if (matchUrl) {
        this.logger.log(
          `[Crawl4AI Discovery] 🎯 URL de cobertura encontrada para ${homeTeam} x ${awayTeam}: ${matchUrl}`,
        );
        return matchUrl;
      }

      // Fallback para qualquer link relevante das fontes
      const anyPortalUrl = links.find((l: string) => sources.some((s) => l.includes(s)));
      if (anyPortalUrl) {
        this.logger.log(`[Crawl4AI Discovery] 🔎 URL de apoio encontrada: ${anyPortalUrl}`);
        return anyPortalUrl;
      }

      return null;
    } catch (err: any) {
      this.logger.warn(`[Crawl4AI Discovery] Falha na busca automática: ${err.message}`);
      return null;
    }
  }

  /**
   * Healthcheck do microserviço Crawl4AI
   */
  async checkHealth(): Promise<{ status: string; memory_usage?: number; cpu_usage?: number } | null> {
    try {
      const response = await axios.get(`${this.baseUrl}/health`, { timeout: 3000 });
      return response.data;
    } catch (err: any) {
      this.logger.warn(`[Crawl4AI] Healthcheck falhou: ${err.message}`);
      return null;
    }
  }
}
