import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { IMatchLiveSourceAdapter } from './base.adapter';
import { MatchLiveTimelineEvent, SourceCrawlResult } from '../crawler.types';

@Injectable()
export class GazetaLiveAdapter implements IMatchLiveSourceAdapter {
  readonly sourceName = 'Gazeta Esportiva';
  private readonly logger = new Logger(GazetaLiveAdapter.name);

  async crawlMatchTimeline(
    homeTeam: string,
    awayTeam: string,
    referenceMinute = 0,
  ): Promise<SourceCrawlResult> {
    const cleanHome = homeTeam.replace(/(EC|FC|SC|CR|SE|AC)$/i, '').trim();
    const cleanAway = awayTeam.replace(/(EC|FC|SC|CR|SE|AC)$/i, '').trim();

    try {
      // 1. Busca no RSS e cobertura da Gazeta Esportiva
      const query = `"${cleanHome}" "${cleanAway}" site:gazetaesportiva.com`;
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
      const headlines: string[] = [];

      for (const item of items.slice(0, 4)) {
        const titleMatch = item.match(/<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/);
        const title = titleMatch ? titleMatch[1].replace(/ - [^-]+$/, '').trim() : '';
        if (title) headlines.push(title);
      }

      // 2. Extrai lances a partir de títulos e feeds com minuto
      const events: MatchLiveTimelineEvent[] = [];
      let maxMin = 0;

      for (const h of headlines) {
        const minMatch = h.match(/(\d+)['’]/);
        if (minMatch) {
          const min = parseInt(minMatch[1], 10);
          if (min > maxMin) maxMin = min;

          let type: MatchLiveTimelineEvent['type'] = 'LANCE';
          if (/GOL/i.test(h)) type = 'GOL';
          else if (/AMARELO|VERMELHO|CARTÃO/i.test(h)) type = 'CARTAO';
          else if (/DEFESA/i.test(h)) type = 'DEFESA';
          else if (/FINALIZAÇÃO|CHUTE|PERIGO/i.test(h)) type = 'FINALIZACAO';
          else if (/SUBSTITUIÇÃO/i.test(h)) type = 'SUBSTITUICAO';

          events.push({
            minute: min,
            half: min <= 45 ? '1T' : '2T',
            type,
            description: h,
            source: this.sourceName,
          });
        }
      }

      this.logger.log(
        `[GazetaAdapter] Coletados ${events.length} lances e ${headlines.length} manchetes da Gazeta para ${homeTeam} x ${awayTeam}`,
      );

      return {
        sourceName: this.sourceName,
        latestMinute: maxMin,
        events,
        headlines,
        success: headlines.length > 0 || events.length > 0,
      };
    } catch (err: any) {
      this.logger.debug(`[GazetaAdapter] Falha ao consultar Gazeta: ${err.message}`);
      return {
        sourceName: this.sourceName,
        latestMinute: 0,
        events: [],
        headlines: [],
        success: false,
        error: err.message,
      };
    }
  }
}
