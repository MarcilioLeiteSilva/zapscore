import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { IMatchLiveSourceAdapter } from './base.adapter';
import { MatchLiveTimelineEvent, SourceCrawlResult } from '../crawler.types';

@Injectable()
export class EspnLiveAdapter implements IMatchLiveSourceAdapter {
  readonly sourceName = 'ESPN';
  private readonly logger = new Logger(EspnLiveAdapter.name);

  async crawlMatchTimeline(
    homeTeam: string,
    awayTeam: string,
    referenceMinute = 0,
  ): Promise<SourceCrawlResult> {
    const cleanHome = homeTeam.replace(/(EC|FC|SC|CR|SE|AC)$/i, '').trim().toLowerCase();
    const cleanAway = awayTeam.replace(/(EC|FC|SC|CR|SE|AC)$/i, '').trim().toLowerCase();

    try {
      // 1. Consulta o scoreboard das ligas suportadas na API pública da ESPN
      const leagues = [
        'bra.1',
        'bra.2',
        'bra.copa_do_brasil',
        'conmebol.libertadores',
        'conmebol.sudamericana',
        'uefa.champions',
        'eng.1',
        'esp.1',
        'ita.1',
      ];
      let targetEvent: any = null;
      let matchedLeague = 'bra.1';

      for (const league of leagues) {
        try {
          const scoreboardUrl = `https://site.api.espn.com/apis/site/v2/sports/soccer/${league}/scoreboard`;
          const sbRes = await axios.get(scoreboardUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
            timeout: 3500,
          });

          const events = sbRes.data?.events || [];
          targetEvent = events.find((ev: any) => {
            const competitors = ev.competitions?.[0]?.competitors || [];
            const names = competitors.map((c: any) => (c.team?.name || '').toLowerCase());
            return (
              names.some((n: string) => n.includes(cleanHome) || cleanHome.includes(n)) &&
              names.some((n: string) => n.includes(cleanAway) || cleanAway.includes(n))
            );
          });

          if (targetEvent) {
            matchedLeague = league;
            break;
          }
        } catch (e: any) {
          this.logger.debug(`[EspnAdapter] Falha ao consultar scoreboard ${league}: ${e.message}`);
        }
      }

      if (!targetEvent?.id) {
        return {
          sourceName: this.sourceName,
          latestMinute: 0,
          events: [],
          success: false,
          error: 'Partida não localizada no scoreboard da ESPN',
        };
      }

      const eventId = targetEvent.id;
      // 2. Consulta o summary detalhado com os comentários e plays do jogo usando o slug da liga encontrada
      const summaryUrl = `https://site.api.espn.com/apis/site/v2/sports/soccer/${matchedLeague}/summary?event=${eventId}`;
      const summaryRes = await axios.get(summaryUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
        timeout: 4000,
      });

      const rawCommentary = summaryRes.data?.commentary || [];
      const parsedEvents: MatchLiveTimelineEvent[] = [];
      let maxMin = 0;

      for (const comm of rawCommentary) {
        const min = comm.time?.elapsed || parseInt(comm.time?.displayValue || '0', 10) || 0;
        if (min > maxMin) maxMin = min;

        const text = comm.text || '';
        let type: MatchLiveTimelineEvent['type'] = 'LANCE';

        if (comm.play?.scoringPlay || /GOL|GOAL/i.test(text)) type = 'GOL';
        else if (comm.play?.redCard || /VERMELHO|RED CARD/i.test(text)) type = 'CARTAO';
        else if (comm.play?.yellowCard || /AMARELO|YELLOW CARD/i.test(text)) type = 'CARTAO';
        else if (/SUBSTITUIÇÃO|SUBSTITUTION|ENTRA|SAI/i.test(text)) type = 'SUBSTITUICAO';
        else if (/DEFESA|SAVE|ESPALMA/i.test(text)) type = 'DEFESA';
        else if (/FINALIZAÇÃO|CHUTE|CABECEIA|FINALIZA/i.test(text)) type = 'FINALIZACAO';
        else if (/FALTA|FOUL/i.test(text)) type = 'FALTA';
        else if (/VAR|PÊNALTI|PENALTY/i.test(text)) type = 'VAR';

        const half = min <= 45 ? '1T' : '2T';

        parsedEvents.push({
          minute: min,
          half,
          type,
          description: text,
          source: this.sourceName,
        });
      }

      this.logger.log(
        `[EspnAdapter] ✅ Extraídos ${parsedEvents.length} lances da ESPN para ${homeTeam} x ${awayTeam} (Minuto mais recente: ${maxMin}')`,
      );

      return {
        sourceName: this.sourceName,
        latestMinute: maxMin,
        events: parsedEvents,
        success: true,
      };
    } catch (err: any) {
      this.logger.warn(`[EspnAdapter] Falha geral ao extrair timeline da ESPN: ${err.message}`);
      return {
        sourceName: this.sourceName,
        latestMinute: 0,
        events: [],
        success: false,
        error: err.message,
      };
    }
  }
}
