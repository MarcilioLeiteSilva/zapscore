import { Injectable, Logger } from '@nestjs/common';
import { EspnLiveAdapter } from './adapters/espn.adapter';
import { GazetaLiveAdapter } from './adapters/gazeta.adapter';
import { GeGloboLiveAdapter } from './adapters/ge-globo.adapter';
import { LanceLiveAdapter } from './adapters/lance.adapter';
import { UolLiveAdapter } from './adapters/uol.adapter';
import {
  MatchLiveTimelineEvent,
  MultiSourceLiveDelta,
  SourceCrawlResult,
} from './crawler.types';

@Injectable()
export class MultiSourceCommentsAgentService {
  private readonly logger = new Logger(MultiSourceCommentsAgentService.name);

  // Cache em memória dos eventos conhecidos por fixture para evitar reprocessamento
  private readonly fixtureEventsCache = new Map<number, MatchLiveTimelineEvent[]>();

  constructor(
    private readonly espnAdapter: EspnLiveAdapter,
    private readonly gazetaAdapter: GazetaLiveAdapter,
    private readonly geAdapter: GeGloboLiveAdapter,
    private readonly lanceAdapter: LanceLiveAdapter,
    private readonly uolAdapter: UolLiveAdapter,
  ) {}

  /**
   * Coleta concorrentemente em todas as fontes (ESPN, Gazeta, GE, Lance!, UOL),
   * normaliza os eventos e extrai o Delta dos últimos 5 minutos de bola rolando.
   */
  async getMatchLiveDelta(
    fixtureExternalId: number,
    homeTeam: string,
    awayTeam: string,
    elapsedMinute: number,
    lastCommentMinute = 0,
  ): Promise<MultiSourceLiveDelta> {
    const adapters = [
      this.espnAdapter,
      this.gazetaAdapter,
      this.geAdapter,
      this.lanceAdapter,
      this.uolAdapter,
    ];

    this.logger.log(
      `[MultiSourceAgent] 🚀 Disparando coleta concorrente em ${adapters.length} fontes para ${homeTeam} x ${awayTeam} (Minuto da partida: ${elapsedMinute}', Último comentário: ${lastCommentMinute}')`,
    );

    // 1. Consulta em paralelo com tolerância a falhas (Promise.allSettled)
    const results = await Promise.allSettled(
      adapters.map((adapter) =>
        adapter.crawlMatchTimeline(homeTeam, awayTeam, elapsedMinute),
      ),
    );

    const successfulResults: SourceCrawlResult[] = [];
    for (const r of results) {
      if (r.status === 'fulfilled' && r.value.success) {
        successfulResults.push(r.value);
      }
    }

    // 2. Identifica a fonte líder (com a minutagem mais avançada) para não travar
    let maxActiveMinute = elapsedMinute;
    let leadSource = 'ZapScore Local';

    for (const sr of successfulResults) {
      if (sr.latestMinute > maxActiveMinute) {
        maxActiveMinute = sr.latestMinute;
        leadSource = sr.sourceName;
      }
    }

    // 3. Unifica e deduplica todos os eventos coletados das fontes
    const allEvents: MatchLiveTimelineEvent[] = [];
    const pressHighlights: string[] = [];

    for (const sr of successfulResults) {
      if (sr.headlines) {
        for (const h of sr.headlines) {
          pressHighlights.push(`• [${sr.sourceName}] ${h}`);
        }
      }
      for (const ev of sr.events) {
        // Evita duplicatas exatas de descrição
        const isDup = allEvents.some(
          (e) =>
            Math.abs(e.minute - ev.minute) <= 1 &&
            e.description.substring(0, 30) === ev.description.substring(0, 30),
        );
        if (!isDup) {
          allEvents.push(ev);
        }
      }
    }

    // Ordena os eventos cronologicamente
    allEvents.sort((a, b) => a.minute - b.minute);

    // Atualiza o cache histórico acumulado da partida
    const existingHistory = this.fixtureEventsCache.get(fixtureExternalId) || [];
    const mergedHistory = [...existingHistory];
    for (const ev of allEvents) {
      const exists = mergedHistory.some(
        (e) => e.minute === ev.minute && e.description === ev.description,
      );
      if (!exists) mergedHistory.push(ev);
    }
    mergedHistory.sort((a, b) => a.minute - b.minute);
    this.fixtureEventsCache.set(fixtureExternalId, mergedHistory);

    // 4. DELTA ENGINE: Isola os eventos ocorridos entre o último comentário e o minuto atual
    const minThreshold = Math.max(0, lastCommentMinute > 0 ? lastCommentMinute : elapsedMinute - 6);
    const deltaEvents = mergedHistory.filter((e) => e.minute >= minThreshold && e.minute <= maxActiveMinute);

    // 5. Linha do Tempo Acumulada de Disciplina (Cartões) e Substituições
    const cumulativeDiscipline = mergedHistory
      .filter((e) => e.type === 'CARTAO' || /amarelo|vermelho|card/i.test(e.description))
      .map((e) => `${e.minute}' [CARTÃO] ${e.description} (${e.source})`);

    const cumulativeSubstitutions = mergedHistory
      .filter((e) => e.type === 'SUBSTITUICAO' || /substitui|entra|sai/i.test(e.description))
      .map((e) => `${e.minute}' [SUBSTITUIÇÃO] ${e.description} (${e.source})`);

    // 6. Monta o sumário bruto e limpo para alimentar a OpenAI
    const deltaText = deltaEvents
      .map((e) => `${e.minute}' [${e.type}] ${e.description} (${e.source})`)
      .join('\n');

    const rawSummary = [
      `FONTE PRINCIPAL ATIVA: ${leadSource} (Minuto registrado: ${maxActiveMinute}')`,
      pressHighlights.length > 0
        ? `--- RADAR MULTI-FONTES (MANCHETES E COBERTURA) ---\n${pressHighlights.slice(0, 6).join('\n')}`
        : '',
      cumulativeDiscipline.length > 0
        ? `--- CARTÕES ACUMULADOS NO JOGO (IMPACTO DISCIPLINAR) ---\n${cumulativeDiscipline.join('\n')}`
        : '',
      cumulativeSubstitutions.length > 0
        ? `--- SUBSTITUIÇÕES REALIZADAS ---\n${cumulativeSubstitutions.join('\n')}`
        : '',
      `--- ACONTECIMENTOS DOS ÚLTIMOS 5 MINUTOS (${minThreshold}' aos ${maxActiveMinute}') ---\n${deltaText || 'Jogo disputado no meio-campo com marcação intensa e sem lances de finalização no período.'}`,
    ]
      .filter(Boolean)
      .join('\n\n');

    this.logger.log(
      `[MultiSourceAgent] 🎯 Delta consolidado para ${homeTeam} x ${awayTeam}: ${deltaEvents.length} lances recentes, ${cumulativeDiscipline.length} cartões acumulados, fonte líder: ${leadSource}`,
    );

    return {
      currentMatchMinute: elapsedMinute,
      maxActiveMinute,
      leadSource,
      deltaEvents,
      cumulativeDiscipline,
      cumulativeSubstitutions,
      pressHighlights,
      rawSummary,
    };
  }

  /**
   * Limpa o cache ao final da partida
   */
  clearFixtureCache(fixtureId: number) {
    this.fixtureEventsCache.delete(fixtureId);
  }
}
