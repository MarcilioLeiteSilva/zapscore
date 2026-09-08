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
   * Coleta o panorama da imprensa esportiva em múltiplas fontes (GE, Lance!, UOL, Gazeta, ESPN)
   * Agrega manchetes, escalações e reportagens táticas recentes para enriquecer o contexto da IA
   */
  async fetchMultiSourcePressRadar(
    homeTeam: string,
    awayTeam: string,
    sources: string[] = ['ge.globo.com', 'lance.com.br', 'uol.com.br', 'gazetaesportiva.com', 'espn.com.br'],
  ): Promise<string> {
    const cleanHome = homeTeam.replace(/(EC|FC|SC|CR|SE|AC)$/i, '').trim();
    const cleanAway = awayTeam.replace(/(EC|FC|SC|CR|SE|AC)$/i, '').trim();
    const results: string[] = [];

    const candidateSources = sources.length > 0 ? sources : ['ge.globo.com', 'lance.com.br', 'uol.com.br'];

    for (const source of candidateSources) {
      try {
        const query = `"${cleanHome}" "${cleanAway}" (desfalques OR suspensos OR escalação OR "onde assistir") site:${source}`;
        const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=pt-BR&gl=BR&ceid=BR:pt-419`;
        const res = await axios.get(rssUrl, {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          },
          timeout: 4000,
        });

        const xml = res.data || '';
        const items = xml.match(/<item>[\s\S]*?<\/item>/g) || [];

        for (const item of items.slice(0, 3)) {
          const titleMatch = item.match(/<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/);
          const descMatch = item.match(/<description>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/);
          const title = titleMatch ? titleMatch[1].replace(/ - [^-]+$/, '').trim() : '';

          let snippet = '';
          if (descMatch) {
            snippet = descMatch[1]
              .replace(/<[^>]*>/g, '')
              .replace(/&nbsp;/g, ' ')
              .replace(/&amp;/g, '&')
              .replace(/&quot;/g, '"')
              .replace(/&#39;/g, "'")
              .trim();
            if (title && snippet.startsWith(title)) {
              snippet = snippet.substring(title.length).trim();
            }
          }

          if (
            title &&
            (title.toLowerCase().includes(cleanHome.toLowerCase()) ||
              title.toLowerCase().includes(cleanAway.toLowerCase()))
          ) {
            const portalLabel = source.replace('.com.br', '').replace('.globo', '').toUpperCase();
            const detailText = snippet && snippet.length > 15 ? ` — Detalhes: ${snippet.substring(0, 180)}...` : '';
            results.push(`• [${portalLabel}] ${title}${detailText}`);
          }
        }
      } catch (err: any) {
        this.logger.debug(`[PressRadar] Falha ao coletar radar de ${source}: ${err.message}`);
      }
    }

    // Busca direcionada para desfalques e pendurados dos dois clubes
    for (const teamName of [cleanHome, cleanAway]) {
      try {
        const desfalqueQuery = `"${teamName}" (desfalques OR suspensos OR "3º amarelo" OR lesionados) site:ge.globo.com`;
        const desfalqueUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(desfalqueQuery)}&hl=pt-BR&gl=BR&ceid=BR:pt-419`;
        const dRes = await axios.get(desfalqueUrl, {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          },
          timeout: 3500,
        });

        const dXml = dRes.data || '';
        const dItems = dXml.match(/<item>[\s\S]*?<\/item>/g) || [];
        if (dItems.length > 0) {
          const first = dItems[0];
          const dTitleMatch = first.match(/<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/);
          const dTitle = dTitleMatch ? dTitleMatch[1].replace(/ - [^-]+$/, '').trim() : '';
          if (dTitle && !results.some((r) => r.includes(dTitle))) {
            results.push(`• [SITUAÇÃO DE ELENCO / DESFALQUES ${teamName.toUpperCase()}] ${dTitle}`);
          }
        }
      } catch (_) {}
    }

    if (results.length > 0) {
      this.logger.log(
        `[PressRadar] 📰 Radar multi-fontes coletado para ${homeTeam} x ${awayTeam} (${results.length} destaques com desfalques/escalações)`,
      );
    }

    return results.slice(0, 10).join('\n');
  }

  /**
   * Busca e descobre automaticamente a URL de cobertura da partida em múltiplas fontes
   * Itera pelas fontes configuradas (ge.globo.com, lance.com.br, uol.com.br, etc.)
   */
  async discoverMatchLiveUrl(
    homeTeam: string,
    awayTeam: string,
    sources: string[] = ['ge.globo.com', 'lance.com.br', 'uol.com.br'],
    isLive = false,
  ): Promise<string | null> {
    try {
      const cleanHome = homeTeam.replace(/(EC|FC|SC|CR|SE|AC)$/i, '').trim();
      const cleanAway = awayTeam.replace(/(EC|FC|SC|CR|SE|AC)$/i, '').trim();

      const candidateSources = sources.length > 0 ? sources : ['ge.globo.com', 'lance.com.br', 'uol.com.br'];

      for (const sourceSite of candidateSources) {
        try {
          const liveKeyword = isLive ? 'tempo real' : 'onde assistir escalações';
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
          const links = uddgMatches
            .map((m: string) => decodeURIComponent(m.replace('uddg=', '')))
            .filter((l: string) => l.includes(sourceSite));

          if (isLive) {
            // Prioriza estritamente páginas de tempo real (/jogo/, temporeal, tempo-real, ao-vivo)
            const liveMatchUrl = links.find(
              (l: string) =>
                l.includes('/jogo/') ||
                l.includes('temporeal') ||
                l.includes('tempo-real') ||
                l.includes('ao-vivo'),
            );
            if (liveMatchUrl) {
              this.logger.log(
                `[Crawl4AI Discovery] ⚡ URL de TEMPO REAL encontrada em ${sourceSite} para ${homeTeam} x ${awayTeam}: ${liveMatchUrl}`,
              );
              return liveMatchUrl;
            }
          }

          // Busca geral em notícias ou cobertura do portal
          const matchUrl = links.find(
            (l: string) =>
              l.includes('/jogo/') ||
              l.includes('temporeal') ||
              l.includes('tempo-real') ||
              l.includes('ao-vivo') ||
              l.includes('/noticia/'),
          );

          if (matchUrl) {
            this.logger.log(
              `[Crawl4AI Discovery] 🎯 URL de cobertura encontrada em ${sourceSite} para ${homeTeam} x ${awayTeam}: ${matchUrl}`,
            );
            return matchUrl;
          }
        } catch (sourceErr: any) {
          this.logger.debug(
            `[Crawl4AI Discovery] Falha ao consultar fonte ${sourceSite}: ${sourceErr.message}`,
          );
        }
      }

      return null;
    } catch (err: any) {
      this.logger.warn(`[Crawl4AI Discovery] Falha na busca automática multi-fontes: ${err.message}`);
      return null;
    }
  }

  /**
   * Extrai e sintetiza os lances narrados em tempo real a partir do Markdown bruto
   */
  extractLiveNarrativeSnippets(markdown: string, maxSnippets = 8): string {
    if (!markdown) return '';
    const lines = markdown.split('\n').map((l) => l.trim()).filter(Boolean);
    const snippets: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const l = lines[i];
      // Reconhece minutos (# 40' 1T, 35', etc) ou termos narrativos de jogo
      const isLance =
        l.match(/^\#?\s*\d+['’]/) ||
        l.match(/GOL|CARTÃO|AMARELO|VERMELHO|IMPEDIMENTO|SUBSTITUIÇÃO|PÊNALTI|DEFESA|FALTA|VAR/i);

      if (isLance) {
        const block = lines.slice(i, i + 3).join(' ').trim();
        // Filtra ruídos de código javascript ou menus
        if (
          block.length > 25 &&
          !block.includes('function(') &&
          !block.includes('<!DOCTYPE') &&
          !block.includes('menu')
        ) {
          snippets.push(block);
          i += 2;
        }
      }

      if (snippets.length >= maxSnippets) break;
    }

    if (snippets.length === 0) {
      // Fallback para os primeiros parágrafos legíveis
      return markdown.slice(0, 1500);
    }

    return snippets.join('\n\n');
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
