import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';
import { PrismaService } from '../prisma/prisma.service';
import { PocketbaseCommentsClient } from './providers/pocketbase-comments.client';
import { Crawl4aiClient } from './providers/crawl4ai.client';
import { MultiSourceCommentsAgentService } from './crawler/multi-source-comments-agent.service';
import { StandingsService } from '../standings/standings.service';
import { FactAuditorService } from './auditor/fact-auditor.service';
import {
  CommentPhase,
  CommentSentiment,
  FixtureCommentRecord,
  GenerateCommentDto,
  TacticalAgentResponse,
  TacticalPromptConfig,
} from './interfaces/tactical-comments.types';
import { FixtureBroadcastRecord } from './crawler/crawler.types';

interface FixtureUrlCacheEntry {
  url: string;
  isLiveUrl: boolean;
  discoveredAt: number;
}

interface MatchStateCacheEntry {
  lastCrawledLances?: string;
  lastCrawledAt?: number;
}

@Injectable()
export class TacticalCommentsService {
  private readonly logger = new Logger(TacticalCommentsService.name);

  // Ligas homologadas inicialmente: Brasileirão Série A (71) e Série B (72)
  private readonly SUPPORTED_LEAGUES = [71, 72];

  // Cache em memória de URLs de cobertura descobertas para cada partida
  private readonly fixtureUrlCache = new Map<number, FixtureUrlCacheEntry>();

  // Cache em memória de estado e lances da partida (evita chamadas redundantes ao Crawl4AI)
  private readonly matchStateCache = new Map<number, MatchStateCacheEntry>();

  private genAI: GoogleGenerativeAI | null = null;
  private openai: OpenAI | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly pbCommentsClient: PocketbaseCommentsClient,
    private readonly crawl4aiClient: Crawl4aiClient,
    private readonly multiSourceAgent: MultiSourceCommentsAgentService,
    private readonly standingsService: StandingsService,
    private readonly factAuditor: FactAuditorService,
  ) {
    this.initializeAiClients();
  }

  private initializeAiClients() {
    // 1. Inicializa OpenAI se configurado
    const openaiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (openaiKey) {
      this.openai = new OpenAI({ apiKey: openaiKey });
      this.logger.log('OpenAI Client inicializado com sucesso para Comentários Táticos (gpt-4o-mini).');
    }

    // 2. Inicializa Gemini se configurado
    const geminiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (geminiKey) {
      this.genAI = new GoogleGenerativeAI(geminiKey);
      this.logger.log('Gemini AI Client inicializado com sucesso para Comentários Táticos (gemini-1.5-flash).');
    }
  }

  /**
   * Obtém a timeline cronológica completa de comentários de uma partida
   */
  async getComments(fixtureExternalId: number): Promise<{
    fixtureId: number;
    total: number;
    comments: FixtureCommentRecord[];
  }> {
    const comments = await this.pbCommentsClient.getCommentsByFixture(fixtureExternalId);
    return {
      fixtureId: fixtureExternalId,
      total: comments.length,
      comments,
    };
  }

  /**
   * Obtém a configuração de calibração do prompt tático
   */
  async getPromptConfig(): Promise<TacticalPromptConfig> {
    return this.pbCommentsClient.getPromptConfig();
  }

  /**
   * Atualiza a configuração de calibração do prompt tático
   */
  async savePromptConfig(config: Partial<TacticalPromptConfig>): Promise<TacticalPromptConfig | null> {
    return this.pbCommentsClient.savePromptConfig(config);
  }

  /**
   * Obtém as informações de transmissão ("Onde Assistir") da partida
   */
  async getBroadcast(fixtureExternalId: number): Promise<FixtureBroadcastRecord | null> {
    return this.pbCommentsClient.getBroadcastByFixture(fixtureExternalId);
  }

  /**
   * Grava ou atualiza a informação de transmissão ("Onde Assistir")
   */
  async saveBroadcast(record: FixtureBroadcastRecord): Promise<FixtureBroadcastRecord | null> {
    return this.pbCommentsClient.saveBroadcast(record);
  }

  /**
   * Pre-aquece e atualiza o contexto do Crawl4AI em background a cada 5 minutos durante partidas ao vivo
   * Coleta lances da partida e o radar jornalístico em múltiplas fontes (GE, Lance!, UOL, Gazeta, ESPN)
   */
  async prewarmLiveExternalContext(
    fixtureExternalId: number,
    homeTeam: string,
    awayTeam: string,
  ): Promise<string | null> {
    try {
      const config = await this.pbCommentsClient.getPromptConfig();
      if (config.enable_crawl4ai === false) return null;

      const now = Date.now();
      const state = this.matchStateCache.get(fixtureExternalId) || {};
      // Se foi coletado há menos de 4 minutos, retorna o que já está em cache
      if (state.lastCrawledAt && now - state.lastCrawledAt < 4 * 60 * 1000 && state.lastCrawledLances) {
        return state.lastCrawledLances;
      }

      const sources = (config.crawl_sources || 'ge.globo.com,lance.com.br,uol.com.br,gazetaesportiva.com,espn.com.br')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      // 1. Obtém ou descobre URL de tempo real ao vivo
      let liveUrl: string | null = null;
      const cached = this.fixtureUrlCache.get(fixtureExternalId);
      if (cached && cached.isLiveUrl && now - cached.discoveredAt < 3 * 3600 * 1000) {
        liveUrl = cached.url;
      } else {
        liveUrl = await this.crawl4aiClient.discoverMatchLiveUrl(homeTeam, awayTeam, sources, true);
        if (liveUrl) {
          this.fixtureUrlCache.set(fixtureExternalId, {
            url: liveUrl,
            isLiveUrl: true,
            discoveredAt: now,
          });
        }
      }

      // 2. Extrai lances em tempo real via Agente Multifontes de Comentários (ESPN, Gazeta, GE, Lance!, UOL)
      let multiSourceContext: string | null = null;
      try {
        const delta = await this.multiSourceAgent.getMatchLiveDelta(
          fixtureExternalId,
          homeTeam,
          awayTeam,
          45,
          0,
        );
        if (delta && delta.rawSummary) {
          multiSourceContext = delta.rawSummary;
        }
      } catch (agentErr: any) {
        this.logger.debug(`[PrewarmLive] Falha no Agente Multifontes: ${agentErr.message}`);
      }

      // 3. Extrai lances em tempo real do jogo com o Crawl4AI como complemento
      let cleanLances: string | null = null;
      if (liveUrl) {
        const markdown = await this.crawl4aiClient.crawlSync(liveUrl, {
          timeoutMs: 15000,
          sessionId: `match_${fixtureExternalId}`,
        });
        if (markdown && markdown.length > 50) {
          cleanLances = this.crawl4aiClient.extractLiveNarrativeSnippets(markdown);
        }
      }

      // 4. Coleta radar multi-fontes da imprensa (Lance!, UOL, GE, Gazeta, ESPN)
      const pressRadar = await this.crawl4aiClient.fetchMultiSourcePressRadar(
        homeTeam,
        awayTeam,
        sources,
      );

      const combinedContext = [
        multiSourceContext
          ? `--- CONTEXTO DO AGENTE MULTIFONTES DE COMENTÁRIOS (LANCES AO VIVO) ---\n${multiSourceContext}`
          : '',
        pressRadar
          ? `--- NOTÍCIAS E DESTAQUES DA IMPRENSA ESPORTIVA (MULTI-FONTES) ---\n${pressRadar}`
          : '',
        cleanLances
          ? `--- LANCES E NARRATIVA EM TEMPO REAL DO JOGO (CRAWL4AI) ---\n${cleanLances}`
          : '',
      ]
        .filter(Boolean)
        .join('\n\n');

      if (combinedContext) {
        this.matchStateCache.set(fixtureExternalId, {
          ...state,
          lastCrawledLances: combinedContext,
          lastCrawledAt: now,
        });
        return combinedContext;
      }

      return null;
    } catch (err: any) {
      this.logger.warn(
        `[PrewarmLive] Falha ao pré-aquecer lances e radar para fixture ${fixtureExternalId}: ${err.message}`,
      );
      return null;
    }
  }

  /**
   * Executa varredura do Agente Multifontes em tempo real e retorna o delta bruto e métricas
   */
  async previewMultiSourceDelta(fixtureExternalId: number) {
    const fixture = await this.prisma.fixture.findFirst({
      where: { externalId: fixtureExternalId },
      include: { homeTeam: true, awayTeam: true, league: true },
    });
    if (!fixture) {
      throw new NotFoundException(`Partida ${fixtureExternalId} não encontrada.`);
    }

    const existingComments = await this.pbCommentsClient.getCommentsByFixture(fixtureExternalId);
    const lastRecordedMinute =
      existingComments.length > 0
        ? Math.max(...existingComments.map((c) => c.minute || 0))
        : 0;

    const delta = await this.multiSourceAgent.getMatchLiveDelta(
      fixtureExternalId,
      fixture.homeTeam.name,
      fixture.awayTeam.name,
      fixture.elapsed || 90,
      lastRecordedMinute,
    );

    return {
      fixtureId: fixtureExternalId,
      homeTeam: fixture.homeTeam.name,
      awayTeam: fixture.awayTeam.name,
      elapsed: fixture.elapsed || 0,
      status: fixture.statusShort,
      lastCommentMinute: lastRecordedMinute,
      delta,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Dispara a geração de um comentário tático para a partida
   */
  async generateTacticalComment(
    fixtureExternalId: number,
    dto: GenerateCommentDto = {},
  ): Promise<TacticalAgentResponse> {
    try {
      // 1. Busca os dados da partida no banco local
      const fixture = await this.prisma.fixture.findFirst({
        where: { externalId: fixtureExternalId },
        include: {
          homeTeam: true,
          awayTeam: true,
          league: true,
          stats: true,
          events: true,
          lineups: true,
        },
      });

      if (!fixture) {
        return {
          success: false,
          message: `Partida ${fixtureExternalId} não encontrada no banco de dados.`,
        };
      }

      const leagueExternalId = fixture.league.externalId;
      if (!this.SUPPORTED_LEAGUES.includes(leagueExternalId)) {
        this.logger.warn(
          `[TacticalComments] Partida ${fixtureExternalId} pertence à liga ${leagueExternalId}, fora do escopo inicial (71, 72). Prosseguindo com aviso.`,
        );
      }

      // 2. Determina a fase e o minuto da partida
      const phase = dto.phase || this.determineMatchPhase(fixture.statusShort);
      const minute = dto.minute ?? (fixture.elapsed || this.getDefaultMinuteForPhase(phase));
      const isLivePhase = ['FIRST_HALF', 'SECOND_HALF', 'HALF_TIME'].includes(phase);

      // 3. Busca histórico de comentários e contexto via Agente Multifontes de Comentários
      const existingComments = await this.pbCommentsClient.getCommentsByFixture(fixtureExternalId);
      const lastRecordedMinute =
        existingComments.length > 0
          ? Math.max(...existingComments.map((c) => c.minute || 0))
          : 0;

      const config = await this.pbCommentsClient.getPromptConfig();
      let externalContext: string | null = null;

      if (config.enable_crawl4ai !== false) {
        if (dto.externalContextUrl) {
          const rawMd = await this.crawl4aiClient.crawlSync(dto.externalContextUrl, {
            timeoutMs: 12000,
            sessionId: `match_${fixtureExternalId}`,
          });
          if (rawMd) {
            externalContext = this.crawl4aiClient.extractLiveNarrativeSnippets(rawMd);
          }
        } else if (isLivePhase) {
          // Coleta prioritária via Agente Multifontes de Comentários (ESPN + Gazeta + GE + Lance + UOL)
          try {
            const delta = await this.multiSourceAgent.getMatchLiveDelta(
              fixtureExternalId,
              fixture.homeTeam.name,
              fixture.awayTeam.name,
              minute,
              lastRecordedMinute,
            );
            if (delta && delta.rawSummary) {
              externalContext = delta.rawSummary;
            }
          } catch (agentErr: any) {
            this.logger.warn(`[MultiSourceAgent] Falha na coleta: ${agentErr.message}`);
          }

          if (!externalContext) {
            externalContext = await this.prewarmLiveExternalContext(
              fixtureExternalId,
              fixture.homeTeam.name,
              fixture.awayTeam.name,
            );
          }
        } else {
          // Fase Pré-Jogo ou Pós-Jogo (artigo analítico, escalações ou balanço final)
          const now = Date.now();
          const sources = (config.crawl_sources || 'ge.globo.com,lance.com.br,uol.com.br,gazetaesportiva.com,espn.com.br')
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean);

          const pressRadar = await this.crawl4aiClient.fetchMultiSourcePressRadar(
            fixture.homeTeam.name,
            fixture.awayTeam.name,
            sources,
          );

          let previewUrl: string | null = null;
          const cached = this.fixtureUrlCache.get(fixtureExternalId);
          if (cached && !cached.isLiveUrl && now - cached.discoveredAt < 4 * 3600 * 1000) {
            previewUrl = cached.url;
          } else {
            previewUrl = await this.crawl4aiClient.discoverMatchLiveUrl(
              fixture.homeTeam.name,
              fixture.awayTeam.name,
              sources,
              false,
            );
            if (previewUrl) {
              this.fixtureUrlCache.set(fixtureExternalId, {
                url: previewUrl,
                isLiveUrl: false,
                discoveredAt: now,
              });
            }
          }

          let articleSnippet: string | null = null;
          if (previewUrl) {
            const rawPreview = await this.crawl4aiClient.crawlSync(previewUrl, {
              timeoutMs: 12000,
              sessionId: `match_${fixtureExternalId}`,
            });
            if (rawPreview) {
              articleSnippet = this.crawl4aiClient.extractLiveNarrativeSnippets(rawPreview);
              if (phase === 'PRE_MATCH') {
                await this.extractAndSaveBroadcastInfo(
                  fixtureExternalId,
                  fixture.league.externalId,
                  fixture.homeTeam.name,
                  fixture.awayTeam.name,
                  rawPreview,
                  previewUrl,
                );
              }
            }
          }

          if (phase === 'PRE_MATCH' && pressRadar) {
            await this.extractAndSaveBroadcastInfo(
              fixtureExternalId,
              fixture.league.externalId,
              fixture.homeTeam.name,
              fixture.awayTeam.name,
              pressRadar,
              previewUrl || '',
            );
          }

          externalContext = [
            pressRadar
              ? `--- NOTÍCIAS E DESTAQUES DA IMPRENSA ESPORTIVA (MULTI-FONTES) ---\n${pressRadar}`
              : '',
            articleSnippet
              ? `--- ARTIGO / COBERTURA DA PARTIDA ---\n${articleSnippet}`
              : '',
          ]
            .filter(Boolean)
            .join('\n\n') || null;
        }
      }

      // 4. Monta o snapshot estatístico
      const statsSnapshot = this.buildStatsSnapshot(fixture.stats, fixture.homeTeamId, fixture.awayTeamId);

      // 5. Memória Factual Acumulada: Linha do tempo de eventos críticos (gols, cartões, VAR, substituições)
      const criticalEvents = (fixture.events || [])
        .filter(
          (e: any) =>
            ['Goal', 'Card', 'Var', 'subst'].includes(e.type?.toLowerCase()) ||
            ['Goal', 'Card', 'Var'].includes(e.type) ||
            e.detail?.toLowerCase().includes('card') ||
            e.detail?.toLowerCase().includes('yellow') ||
            e.detail?.toLowerCase().includes('red') ||
            e.detail?.toLowerCase().includes('gol') ||
            e.detail?.toLowerCase().includes('penalty'),
        )
        .map(
          (e: any) =>
            `${e.time?.elapsed || 0}' [${(e.detail || e.type || '').toUpperCase()}] ${e.player?.name || ''} (${e.team?.name || ''})`,
        );

      // 6. Memória Narrativa: Histórico completo de comentários anteriores para continuidade do arco
      const previousTheses = existingComments.map(
        (c) =>
          `[${c.phase} ${c.minute !== undefined ? `${c.minute}'` : ''}]: Título: "${c.title}" | Resumo: "${c.comment.substring(0, 110)}..."`,
      );
      const recentComments = existingComments.slice(-3);

      // 7. Contexto Factual Oficial da Tabela (Standings Snapshot)
      let homeRank: number | undefined;
      let awayRank: number | undefined;
      let homePoints: number | undefined;
      let awayPoints: number | undefined;
      let standingsText = '';

      try {
        const standings = await this.standingsService.findMany({
          leagueId: leagueExternalId,
          season: 2026,
        });
        if (Array.isArray(standings) && standings.length > 0) {
          const homeEntry = standings.find(
            (s: any) =>
              s.teamId === fixture.homeTeamId ||
              s.team?.externalId === fixture.homeTeam?.externalId ||
              s.team?.name === fixture.homeTeam?.name,
          );
          const awayEntry = standings.find(
            (s: any) =>
              s.teamId === fixture.awayTeamId ||
              s.team?.externalId === fixture.awayTeam?.externalId ||
              s.team?.name === fixture.awayTeam?.name,
          );

          if (homeEntry) {
            homeRank = homeEntry.rank;
            homePoints = homeEntry.points;
          }
          if (awayEntry) {
            awayRank = awayEntry.rank;
            awayPoints = awayEntry.points;
          }

          const tableWarnings: string[] = [];
          if (homeRank && homeRank > 6) {
            tableWarnings.push(`• AVISO: O ${fixture.homeTeam.name} está em ${homeRank}º lugar: NÃO DISPUTA O G4 NEM O TÍTULO! Jamais mencione que busca ou disputa G4/título.`);
          }
          if (awayRank && awayRank > 6) {
            tableWarnings.push(`• AVISO: O ${fixture.awayTeam.name} está em ${awayRank}º lugar: NÃO DISPUTA O G4 NEM O TÍTULO! Jamais mencione que busca ou disputa G4/título.`);
          }
          if (homeRank && homeRank > 6 && awayRank && awayRank > 6) {
            tableWarnings.push(`• ATENÇÃO MÁXIMA: NENHUM DOS DOIS CLUBES ESTÁ NO G4. É TERMINANTEMENTE PROIBIDO QUALQUER CITAÇÃO A G4 NESTE COMENTÁRIO!`);
          }

          standingsText = `CLASSIFICAÇÃO REAL NO CAMPEONATO (STANDINGS OFICIAIS):
• ${fixture.homeTeam.name}: ${homeRank ? `${homeRank}º lugar (${homePoints} pts)` : 'Posição não catalogada'}
• ${fixture.awayTeam.name}: ${awayRank ? `${awayRank}º lugar (${awayPoints} pts)` : 'Posição não catalogada'}${tableWarnings.length > 0 ? `\n${tableWarnings.join('\n')}` : ''}`;
        }
      } catch (stErr: any) {
        this.logger.debug(`[Standings] Falha ao carregar tabela para liga ${leagueExternalId}: ${stErr.message}`);
      }

      // 7.5 Escalações Oficiais do Lineup Agent
      let lineupsText = '';
      if (fixture.lineups && fixture.lineups.length > 0) {
        const homeLineups = fixture.lineups.filter(
          (l: any) => l.teamId === fixture.homeTeam.externalId || l.teamId === Number(fixture.homeTeam.id),
        );
        const awayLineups = fixture.lineups.filter(
          (l: any) => l.teamId === fixture.awayTeam.externalId || l.teamId === Number(fixture.awayTeam.id),
        );

        const homeStarters = homeLineups
          .filter((l: any) => l.isStart)
          .map((l: any) => `${l.player}${l.number ? ` (#${l.number})` : ''}${l.pos ? ` [${l.pos}]` : ''}`);
        const homeBench = homeLineups.filter((l: any) => !l.isStart).map((l: any) => l.player);
        const awayStarters = awayLineups
          .filter((l: any) => l.isStart)
          .map((l: any) => `${l.player}${l.number ? ` (#${l.number})` : ''}${l.pos ? ` [${l.pos}]` : ''}`);
        const awayBench = awayLineups.filter((l: any) => !l.isStart).map((l: any) => l.player);

        lineupsText = `ESCALAÇÕES OFICIAIS (FONTE: LINEUP AGENT / SÚMULA CONFIRMADA):
• ${fixture.homeTeam.name} (Titulares): ${homeStarters.length > 0 ? homeStarters.join(', ') : 'Em apuração'}
  ${fixture.homeTeam.name} (Reservas): ${homeBench.length > 0 ? homeBench.slice(0, 10).join(', ') : 'Não informado'}
• ${fixture.awayTeam.name} (Titulares): ${awayStarters.length > 0 ? awayStarters.join(', ') : 'Em apuração'}
  ${fixture.awayTeam.name} (Reservas): ${awayBench.length > 0 ? awayBench.slice(0, 10).join(', ') : 'Não informado'}`;
      }

      // 7.6 Retrospecto dos Últimos Jogos (Momentum Recente das Equipes)
      let recentMatchesText = '';
      if (phase === 'PRE_MATCH') {
        try {
          const [homeRecent, awayRecent] = await Promise.all([
            this.prisma.fixture.findMany({
              where: {
                OR: [{ homeTeamId: fixture.homeTeamId }, { awayTeamId: fixture.homeTeamId }],
                statusShort: { in: ['FT', 'AET', 'PEN'] },
                date: { lt: fixture.date },
              },
              orderBy: { date: 'desc' },
              take: 3,
              include: { homeTeam: true, awayTeam: true },
            }),
            this.prisma.fixture.findMany({
              where: {
                OR: [{ homeTeamId: fixture.awayTeamId }, { awayTeamId: fixture.awayTeamId }],
                statusShort: { in: ['FT', 'AET', 'PEN'] },
                date: { lt: fixture.date },
              },
              orderBy: { date: 'desc' },
              take: 3,
              include: { homeTeam: true, awayTeam: true },
            }),
          ]);

          const formatMatches = (matches: any[], teamId: string) =>
            matches
              .map((m) => {
                const isHome = m.homeTeamId === teamId;
                const goalsFor = isHome ? (m.homeGoals ?? 0) : (m.awayGoals ?? 0);
                const goalsAgainst = isHome ? (m.awayGoals ?? 0) : (m.homeGoals ?? 0);
                const res = goalsFor > goalsAgainst ? 'V' : goalsFor < goalsAgainst ? 'D' : 'E';
                return `${m.homeTeam?.name || 'Time'} ${m.homeGoals ?? 0} x ${m.awayGoals ?? 0} ${m.awayTeam?.name || 'Time'} (${res})`;
              })
              .join(' | ');

          recentMatchesText = `RETROSPECTO RECENTE (ÚLTIMOS JOGOS NO CAMPEONATO):
• ${fixture.homeTeam.name}: ${homeRecent.length > 0 ? formatMatches(homeRecent, fixture.homeTeamId) : 'Sem dados recentes'}
• ${fixture.awayTeam.name}: ${awayRecent.length > 0 ? formatMatches(awayRecent, fixture.awayTeamId) : 'Sem dados recentes'}`;
        } catch (rErr: any) {
          this.logger.debug(`[RecentMatches] Falha ao consultar jogos recentes: ${rErr.message}`);
        }
      }

      const previousTitles = existingComments.map((c) => c.title).filter(Boolean);

      // Sanitiza recentComments antes de passar para o prompt para evitar contaminação por alucinações de minutos anteriores
      const sanitizedRecentComments = recentComments.map((rc) => {
        const audited = this.factAuditor.auditComment(rc.title, rc.comment, {
          homeTeam: fixture.homeTeam.name,
          awayTeam: fixture.awayTeam.name,
          homeScore: fixture.homeGoals ?? 0,
          awayScore: fixture.awayGoals ?? 0,
          homeRank,
          awayRank,
          previousTitles,
        });
        return {
          ...rc,
          title: audited.sanitizedTitle,
          comment: audited.sanitizedComment,
        };
      });

      // 8. Gera a leitura tática via LLM com Prompt Caching nativo
      const insight = await this.generateInsight({
        homeTeam: fixture.homeTeam.name,
        awayTeam: fixture.awayTeam.name,
        homeScore: fixture.homeGoals ?? 0,
        awayScore: fixture.awayGoals ?? 0,
        statusShort: fixture.statusShort || 'NS',
        elapsed: minute,
        phase,
        events: fixture.events.slice(-8), // últimos 8 eventos detalhados
        criticalEvents,
        previousTheses,
        previousTitles,
        lineupsText,
        stats: statsSnapshot,
        externalContext,
        recentComments: sanitizedRecentComments,
        standingsText,
        recentMatchesText,
      });

      // 9. AGENTE AUDITOR DE FATOS: Inspeciona e sanitiza qualquer inconsistência antes de salvar
      const audit = this.factAuditor.auditComment(insight.title, insight.comment, {
        homeTeam: fixture.homeTeam.name,
        awayTeam: fixture.awayTeam.name,
        homeScore: fixture.homeGoals ?? 0,
        awayScore: fixture.awayGoals ?? 0,
        homeRank,
        awayRank,
        homePoints,
        awayPoints,
        liveLancesText: externalContext || '',
        previousTitles,
      });

      // 10. Grava no PocketBase Comentários dedicado (Comentário 100% Auditado e Aprovado)
      const savedRecord = await this.pbCommentsClient.saveComment({
        fixture_id: fixtureExternalId,
        league_id: leagueExternalId,
        minute,
        phase,
        title: audit.sanitizedTitle,
        comment: audit.sanitizedComment,
        sentiment: insight.sentiment,
        stats_snapshot: statsSnapshot,
      });

      if (!savedRecord) {
        return {
          success: false,
          message: 'Falha ao persistir comentário na instância do PocketBase.',
        };
      }

      return {
        success: true,
        data: savedRecord,
      };
    } catch (err: any) {
      this.logger.error(`Erro ao gerar comentário tático: ${err.message}`);
      return {
        success: false,
        message: err.message,
      };
    }
  }

  private determineMatchPhase(statusShort?: string | null): CommentPhase {
    if (!statusShort || ['NS', 'TBD'].includes(statusShort)) return 'PRE_MATCH';
    if (statusShort === '1H') return 'FIRST_HALF';
    if (statusShort === 'HT') return 'HALF_TIME';
    if (statusShort === '2H') return 'SECOND_HALF';
    if (['FT', 'AET', 'PEN'].includes(statusShort)) return 'FULL_TIME';
    return 'FIRST_HALF';
  }

  private getDefaultMinuteForPhase(phase: CommentPhase): number {
    switch (phase) {
      case 'PRE_MATCH':
        return 0;
      case 'FIRST_HALF':
        return 25;
      case 'HALF_TIME':
        return 45;
      case 'SECOND_HALF':
        return 70;
      case 'FULL_TIME':
        return 90;
    }
  }

  private buildStatsSnapshot(stats: any[], homeTeamId: string, awayTeamId: string): Record<string, any> {
    const summary: Record<string, any> = { home: {}, away: {} };
    for (const s of stats) {
      const isHome = s.teamId?.toString() === homeTeamId;
      const side = isHome ? 'home' : 'away';
      summary[side][s.type] = s.value;
    }
    return summary;
  }

  private async generateInsight(context: {
    homeTeam: string;
    awayTeam: string;
    homeScore: number;
    awayScore: number;
    statusShort: string;
    elapsed: number;
    phase: CommentPhase;
    events: any[];
    criticalEvents?: string[];
    previousTheses?: string[];
    previousTitles?: string[];
    lineupsText?: string;
    stats: any;
    externalContext: string | null;
    recentComments?: FixtureCommentRecord[];
    standingsText?: string;
    recentMatchesText?: string;
  }): Promise<{ title: string; comment: string; sentiment: CommentSentiment }> {
    const provider = (this.configService.get<string>('AI_PROVIDER') || 'OPENAI').toUpperCase();

    if (!this.openai && !this.genAI) {
      return {
        title: `${context.homeTeam} ${context.homeScore} x ${context.awayScore} ${context.awayTeam}`,
        comment: `Partida movimentada na fase ${context.phase}. Análise tática aguardando ativação da IA.`,
        sentiment: 'EQUILIBRADO',
      };
    }

    // Carrega a configuração dinâmica calibrada pelo AdminPanel
    const config = await this.pbCommentsClient.getPromptConfig();

    const coachPct = 100 - config.coach_vs_fan;
    const fanPct = config.coach_vs_fan;

    let toneDescription = 'Tom equilibrado e dinâmico, resenha esportiva moderna.';
    if (config.casualness <= 25) {
      toneDescription = 'Tom formal, sóbrio e estritamente analítico/jornalístico.';
    } else if (config.casualness <= 60) {
      toneDescription = 'Tom equilibrado, dinâmico e direto, como um bom debate esportivo moderno.';
    } else if (config.casualness <= 85) {
      toneDescription = 'Tom bem casual, resenha de boleiro inteligente, vocabulário autêntico do futebol brasileiro, sem academicismo excessivo.';
    } else {
      toneDescription = 'Tom ultra casual de pura resenha de torcedor e bate-papo de arquibancada, vibrante e bem humorado.';
    }

    // Controle de tamanho do texto por fase
    let lengthInstruction = '';
    const isLive = context.phase === 'FIRST_HALF' || context.phase === 'SECOND_HALF';
    if (context.phase === 'PRE_MATCH') {
      lengthInstruction = `FORMATO PRÉ-JOGO COMPLETO E APROFUNDADO EM SEÇÕES (250 A 400 PALAVRAS):
É TERMINANTEMENTE PROIBIDO gerar parágrafos corridos curtos ou genéricos! Estruture o texto obrigatoriamente com quebras de linha duplas e as seguintes seções com emojis editoriais:

🎙️ O MOMENTO DAS EQUIPES: Análise aprofundada da posição na tabela, necessidade de vitória e retrospecto recente de jogos de cada clube.
⚔️ DESFALQUES, SUSPENSÕES E RETORNOS: Liste nominalmente cada jogador fora por lesão (departamento médico), os suspensos por cartões e os retornos/dúvidas, separando claramente por clube (com base nos dados apurados).
📋 ESCALAÇÕES (PROVÁVEIS OU CONFIRMADAS): Apresente o time titular e principais opções de cada lado.
🔎 LEITURA TÁTICA E TENDÊNCIA: Onde a partida será decidida, propostas de jogo, encaixe das linhas e a tendência do confronto.`;
    } else if (context.phase === 'HALF_TIME') {
      lengthInstruction = `FORMATO DE INTERVALO COMPLETO E APROFUNDADO EM SEÇÕES (220 A 350 PALAVRAS):
É TERMINANTEMENTE PROIBIDO gerar parágrafos corridos curtos ou genéricos! Estruture o comentário do intervalo obrigatoriamente com quebras de linha duplas e as seguintes seções com emojis editoriais:

⏸️ LEITURA DOS PRIMEIROS 45 MINUTOS:
- 🔥 Quem está dominando: Análise de quem controlou o jogo e teve chances reais de gol.
- 📈 Equipe em crescimento vs 📉 Equipe em queda: Mudança de volume e intensidade ao longo da etapa inicial.

⭐ DESTAQUES & CONFRONTOS INDIVIDUAIS:
- ⭐ Jogador mais influente: Quem se destacou tecnicamente e taticamente no 1º tempo.
- ⚔️ Confronto individual decisivo: O duelo mais acirrado da partida (ex: ponta contra lateral, atacante contra zaga).

🚨 O NÓ TÁTICO & AJUSTES DE VESTIÁRIO:
- 🚨 Principal problema: O que travou a criação ou expôs a equipe na defesa.
- 🔄 Substituição ou ajuste tático provável: O que os treinadores precisam corrigir no vestiário para a volta.

🔮 PROJEÇÃO PARA O 2º TEMPO:
- 🎯 Caminho provável para o gol: Onde estão os espaços e brechas defensivas a explorar.
- 🔮 Cenário do 2º tempo: A tendência tática e psicológica dos 45 minutos finais.`;
    } else if (context.phase === 'FULL_TIME') {
      lengthInstruction = `FORMATO DE FIM DE JOGO / RESENHA COMPLETA DOS 90 MINUTOS EM SEÇÕES (280 A 450 PALAVRAS):
É TERMINANTEMENTE PROIBIDO gerar apenas um resumo simples do placar ou parágrafos corridos clichês! Estruture a resenha final obrigatoriamente com quebras de linha duplas e as seguintes seções com emojis editoriais:

🏁 O VEREDITO:
O que realmente decidiu a partida (eficiência nas finalizações, superioridade tática, erro individual ou imposição física).

🎬 A HISTÓRIA DO JOGO:
Como os 90 minutos se desenvolveram (postura inicial, oscilações de ritmo, reviravoltas e o desfecho).

⭐ OS PROTAGONISTAS:
Melhor jogador em campo, destaque positivo e o jogador ou setor que decepcionou.

🧠 A LEITURA TÁTICA:
Qual estratégia funcionou e qual plano de jogo falhou (linhas, encaixe de marcação e transições).

⚡ O MOMENTO-CHAVE:
O lance capital que mudou o rumo da partida (gol decisivo, expulsão, defesa salvadora ou mexida do treinador).

📊 OS NÚMEROS QUE EXPLICAM O RESULTADO:
Poucos números (posse, finalizações no alvo, desarmes), mas sempre interpretados com inteligência tática, e não apenas números jogados na tela.

🏆 QUEM SAI GANHANDO:
Não apenas quem somou os pontos, mas quem sai fortalecido moral e taticamente para a sequência.

🔮 O QUE VEM AGORA:
Impacto direto do resultado na tabela de classificação e os próximos desafios de cada clube.`;
    } else if (isLive) {
      if (config.live_length === 'FLASH') {
        lengthInstruction = 'TAMANHO ULTRA-CURTO / FLASH: No máximo 2 frases diretas e objetivas (cerca de 25 a 35 palavras). Vá direto ao ponto sem rodeios.';
      } else if (config.live_length === 'SHORT') {
        lengthInstruction = 'TAMANHO CURTO (METADE DO PADRÃO): Exatamente 1 parágrafo enxuto, ágil e direto (cerca de 40 a 50 palavras). Leitura rápida do momento atual em campo.';
      } else {
        lengthInstruction = 'TAMANHO PADRÃO: 1 a 2 parágrafos objetivos (cerca de 70 a 90 palavras).';
      }
    } else {
      if (config.pause_length === 'SUMMARY') {
        lengthInstruction = 'TAMANHO SÍNTESE: 1 parágrafo bem consolidado com os pontos capitais (cerca de 50 a 60 palavras).';
      } else {
        lengthInstruction = 'TAMANHO COMPLETO E APROFUNDADO: 1 a 2 parágrafos densos e analíticos (cerca de 80 a 120 palavras), dissecando o panorama da partida.';
      }
    }

    const focusPoints: string[] = [];
    if (config.focus_highlights) {
      focusPoints.push('- Destaque atuações individuais e jogadores decisivos (melhor/pior em campo, jogadas de destaque).');
    }
    if (config.focus_table_impact) {
      focusPoints.push('- Contextualize a pontuação e o impacto na tabela (briga por G4, liderança ou fuga do Z4).');
    }
    if (config.focus_substitutions) {
      focusPoints.push('- Avalie as substituições feitas pelos técnicos e a mudança de desenho tático.');
    }

    const phaseInstructions: Record<CommentPhase, string> = {
      PRE_MATCH:
        'Foco no Pré-Jogo: Destaque os fatos reais, momentos recentes, lista nominal de desfalques, suspensos, prováveis escalações e a leitura tática de onde o confronto será definido.',
      FIRST_HALF:
        'Foco no 1º Tempo: Ritmo inicial, encaixe de marcação, aproveitamento das transições e momentos de perigo.',
      HALF_TIME:
        'Foco no Intervalo: Dissecção profunda dos primeiros 45 minutos. Avalie o domínio do jogo, destaques individuais, nós táticos e aponte com clareza os ajustes de vestiário e projeção para a etapa final.',
      SECOND_HALF:
        'Foco no 2º Tempo: Mudança de postura pós-substituições, desgaste físico, pressão no campo adversário e efetividade.',
      FULL_TIME:
        'Foco no Pós-Jogo / Resenha Final: Balanço tático profundo dos 90 minutos seguindo rigorosamente o roteiro editorial (O Veredito, A História do Jogo, Os Protagonistas, A Leitura Tática, O Momento-Chave, Os Números que Explicam o Resultado, Quem Sai Ganhando e O Que Vem Agora).',
    };

    let phaseInstruction = phaseInstructions[context.phase];
    if (context.phase === 'FIRST_HALF') {
      if (context.elapsed <= 20) {
        phaseInstruction =
          'Foco no Início do 1º Tempo (Janela inicial): Ritmo inicial, encaixe de marcação, disposição em campo e estudo mútuo entre as equipes.';
      } else {
        phaseInstruction =
          'Foco durante o 1º Tempo (Andamento consolidado): Como as equipes se assentaram no gramado, criação de chances, posse efetiva e controle tático.';
      }
    } else if (context.phase === 'SECOND_HALF') {
      if (context.elapsed <= 62) {
        phaseInstruction =
          'Foco no Início do 2º Tempo (Retorno do intervalo): Mudanças de postura após a conversa de vestiário, substituições feitas no intervalo e novo ímpeto em campo.';
      } else {
        phaseInstruction =
          'Foco durante o 2º Tempo (Reta final e desfecho): Desgaste físico, alterações táticas dos técnicos, pressão em busca do placar e organização sob tensão.';
      }
    }

    const systemPrompt = `Você é um comentarista e analista tático especializado no futebol brasileiro (Brasileirão Série A e B).
Sua missão é produzir leituras táticas de alto nível, autênticas, perspicazes e dinâmicas, no formato de resenha esportiva inteligente.

REGRAS OBRIGATÓRIAS DE IDIOMA E FORMATAÇÃO (RIGOROSO):
1. OBEDEÇA RIGOROSAMENTE AO IDIOMA (SEM MISTURA DE LÍNGUAS):
   - O texto em português deve ser 100% natural, com ZERO estrangeirismos.
   - NÃO use termos em inglês (ex: clean sheet, turnover, pressing, winger, build-up, half-time, full-time).
2. REGRAS MANDATÓRIAS DE TABELA E ANTI-ALUCINAÇÃO (RIGOROSO):
   - Você DEVE respeitar estritamente a classificação oficial fornecida no prompt.
   - É TERMINANTEMENTE PROIBIDO inventar disputas de G4, título ou Z4 que não correspondam à posição oficial fornecida.
   - Exemplo: se um clube está em 12º lugar, ele está no meio da tabela/Sul-Americana; JAMAIS diga que ele disputa o G4 ou título!
3. O COMENTÁRIO É A EXPRESSÃO PURA DO JOGO (PROIBIDO CITAR TRANSMISSÃO / 'ONDE ASSISTIR'):
   - O comentário tático pertence ESTRITAMENTE ao gramado: leitura de jogo, postura tática, dinâmica da bola e contexto esportivo.
   - É TERMINANTEMENTE PROIBIDO citar canais de TV, emissoras (ex: Globo, SporTV, Premiere, ESPN, SBT), serviços de streaming (ex: Max, CazéTV, Prime Video) ou frases como 'onde assistir', 'transmissão ao vivo', 'será transmitido por'. As informações de transmissão possuem um card isolado no aplicativo e NÃO devem poluir o comentário tático.
4. Responda ESTRITAMENTE em formato JSON puro, sem blocos markdown adicionais.
5. Título ("title"): Manchete de impacto tático, máximo 10 palavras, 100% em português puro sem jargões em inglês.
6. Comentário ("comment"): Respeite estritamente a extensão e o formato solicitados pelo usuário no prompt.
7. Sentimento ("sentiment"): Escolha uma das opções rigorosamente em português (em maiúsculo):
   - "EQUILIBRADO" (jogos parelhos e disputa tática equilibrada)
   - "DOMINANTE" (amplo controle de jogo, pressão e superioridade)
   - "CRITICO" (expulsão, pênalti decisivo, momento de alta tensão)
   - "SURPRESA" (zebra, resultado inesperado ou virada improvável)
8. REGRA INEGOCIÁVEL DE TÍTULOS INÉDITOS E ANTI-CLICHÊ:
   - É TERMINANTEMENTE PROIBIDO repetir qualquer título já utilizado em comentários anteriores desta partida.
   - É PROIBIDO usar títulos clichês e vazios como "Expectativa de um duelo tático equilibrado", "Duelo equilibrado", "Empate sem emoção", "Estudo mútuo e ritmo morno".
   - O título DEVE ser uma manchete viva, inédita e criativa, destacando os fatos concretos, os nomes dos atletas decisivos ou a estratégia pontual.
9. FATOS NOMINAIS, DESFALQUES E PROIBIÇÃO DE JORNALÊS PROTOCOLAR:
   - É TERMINANTEMENTE PROIBIDO iniciar o comentário com "A partida promete ser um embate interessante", "O confronto promete ser disputado" ou qualquer variação de abertura genérica. Comece direto no fato, no momento do campeonato ou no impacto do jogo.
   - No Pré-Jogo, NUNCA termine falando de "substituições dos treinadores" de forma genérica. Foque no duelo de início, nos esquemas táticos e nos desfalques.
   - No Fim de Jogo / Resenha Final, NUNCA gere apenas um resumo simples de placar. Siga integralmente o roteiro editorial com todos os tópicos e emojis solicitados.
   - Cite nominalmente todos os jogadores em evidência (gols, assistências, defesas, desfalques, destaques e quem decepcionou).

FORMATO JSON ESPERADO:
{
  "title": "<manchete curta pura em português>",
  "comment": "<análise tática respeitando o tamanho e formato solicitados>",
  "sentiment": "EQUILIBRADO" | "DOMINANTE" | "CRITICO" | "SURPRESA"
}`;

    const userPrompt = `
LEITURA TÁTICA DA PARTIDA:
CONFRONTO: ${context.homeTeam} ${context.homeScore} x ${context.awayScore} ${context.awayTeam}
FASE ATUAL: ${context.phase} (Minuto: ${context.elapsed}')
STATUS: ${context.statusShort}

CALIBRAÇÃO DE ESTILO E TOM:
- PERSPECTIVA: ${coachPct}% Visão do Técnico (prancheta, linhas) e ${fanPct}% Visão do Torcedor (emoção, vibração).
- GRAU DE CASUALIDADE / RESENHA: ${config.casualness}% (${toneDescription}).
- DIRETRIZ DE EXTENSÃO E FORMATO:
${lengthInstruction}
${focusPoints.length > 0 ? `\nFOCOS ADICIONAIS:\n${focusPoints.join('\n')}` : ''}
${config.custom_rules ? `\nREGRAS PERSONALIZADAS DO USUÁRIO:\n${config.custom_rules}\n` : ''}

${context.standingsText ? `\n${context.standingsText}\n` : ''}
${context.recentMatchesText ? `\n${context.recentMatchesText}\n` : ''}
${context.lineupsText ? `\n${context.lineupsText}\n` : ''}
${context.previousTitles && context.previousTitles.length > 0 ? `\nTÍTULOS JÁ UTILIZADOS NESTA PARTIDA (É PROIBIDO REPETIR OU USAR VARIAÇÃO DESTES):\n${context.previousTitles.map((t) => `• "${t}"`).join('\n')}\n` : ''}
MEMÓRIA FACTUAL DA PARTIDA (LINHA DO TEMPO CRÍTICA ACUMULADA):
${context.criticalEvents && context.criticalEvents.length > 0 ? context.criticalEvents.join('\n') : 'Nenhum evento crítico acumulado até o momento.'}

ARCO NARRATIVO E CONTINUIDADE (ANÁLISES ANTERIORES DA IA NESTA PARTIDA):
${context.previousTheses && context.previousTheses.length > 0 ? context.previousTheses.join('\n') : 'Primeira leitura da partida.'}

CONTEXTO EXTERNO E MULTI-FONTES (LANCES AO VIVO CRAWL4AI + RADAR DE IMPRENSA ESPORTIVA):
${context.externalContext ? context.externalContext : 'Sem contexto externo adicional no momento.'}

ESTATÍSTICAS ATUAIS:
${JSON.stringify(context.stats, null, 2)}

ÚLTIMOS EVENTOS DETALHADOS:
${JSON.stringify(context.events, null, 2)}

DIRETRIZ DA FASE ATUAL:
${phaseInstruction}

DIRETRIZ MANDATÓRIA DE CONTEXTO REAL E NÃO-REPETIÇÃO:
- É TERMINANTEMENTE PROIBIDO repetir títulos ou diagnósticos já feitos nos comentários anteriores desta mesma partida. Crie títulos inéditos!
- No Pré-Jogo, foque em desfalques reais, jogadores suspensos, novidades na escalação e impacto na tabela, divididos nas seções solicitadas.
- Durante o jogo ao vivo (de 5 em 5 minutos), foque no que ACONTECEU E MUDOU nos últimos minutos (cartões aplicados, defesas difíceis, finalizações, faltas duras, substituições e alteração nas linhas).
- Se houver cartões amarelos/vermelhos, substituições ou defesas difíceis nos eventos/lances, cite nominalmente os jogadores envolvidos.
- Traga a resenha autêntica do futebol brasileiro com base nos fatos reais de campo e na repercussão da imprensa!
`;

    const normalizeSentiment = (raw?: string): CommentSentiment => {
      const s = (raw || '').toUpperCase().trim();
      if (s === 'SURPRISE' || s === 'SURPRESA') return 'SURPRESA';
      if (s === 'DOMINANT' || s === 'DOMINANTE') return 'DOMINANTE';
      if (s === 'CRITICAL' || s === 'CRITICO' || s === 'CRÍTICO') return 'CRITICO';
      return 'EQUILIBRADO';
    };

    const targetTemperature = ['PRE_MATCH', 'HALF_TIME', 'FULL_TIME'].includes(context.phase) ? 0.5 : 0.2;

    // 1. Tenta com OpenAI se for o provider selecionado ou se disponível (com Prompt Caching no system message)
    if ((provider === 'OPENAI' || !this.genAI) && this.openai) {
      try {
        const completion = await this.openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: systemPrompt,
            },
            { role: 'user', content: userPrompt },
          ],
          response_format: { type: 'json_object' },
          temperature: targetTemperature,
        });

        const rawText = completion.choices[0].message.content || '{}';
        const parsed = JSON.parse(rawText);

        return {
          title: parsed.title || `${context.homeTeam} x ${context.awayTeam}`,
          comment: parsed.comment || 'Análise tática em andamento.',
          sentiment: normalizeSentiment(parsed.sentiment),
        };
      } catch (openAiErr: any) {
        this.logger.warn(`Erro na chamada OpenAI: ${openAiErr.message}. Tentando Gemini como fallback se disponível.`);
      }
    }

    // 2. Tenta com Gemini se OpenAI não rodou ou se for o provider selecionado (com systemInstruction)
    if (this.genAI) {
      try {
        const model = this.genAI.getGenerativeModel({
          model: 'gemini-1.5-flash',
          systemInstruction: systemPrompt,
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: ['PRE_MATCH', 'HALF_TIME', 'FULL_TIME'].includes(context.phase) ? 0.55 : 0.4,
          },
        });

        const result = await model.generateContent(userPrompt);
        let text = result.response.text().trim();

        if (text.startsWith('```')) {
          text = text.replace(/^```json\s*/, '').replace(/```$/, '').trim();
        }

        const parsed = JSON.parse(text);
        return {
          title: parsed.title || `${context.homeTeam} x ${context.awayTeam}`,
          comment: parsed.comment || 'Análise tática em andamento.',
          sentiment: normalizeSentiment(parsed.sentiment),
        };
      } catch (geminiErr: any) {
        this.logger.warn(`Erro na chamada Gemini: ${geminiErr.message}.`);
      }
    }

    // 3. Fallback gracioso caso ambos falhem
    return {
      title: `${context.homeTeam} ${context.homeScore} x ${context.awayScore} ${context.awayTeam}`,
      comment: `Duelo equilibrado entre ${context.homeTeam} e ${context.awayTeam}. As equipes disputam o controle da partida na fase ${context.phase}.`,
      sentiment: 'EQUILIBRADO',
    };
  }

  /**
   * Extrai canais de transmissão de matérias pré-jogo e salva no PocketBase
   */
  private async extractAndSaveBroadcastInfo(
    fixtureExternalId: number,
    leagueExternalId: number,
    homeTeam: string,
    awayTeam: string,
    rawContent: string,
    sourceUrl?: string,
  ): Promise<void> {
    try {
      if (!rawContent || rawContent.length < 50) return;

      const lower = rawContent.toLowerCase();
      // Verifica se há menção a transmissão ou onde assistir
      if (
        !lower.includes('onde assistir') &&
        !lower.includes('transmissão') &&
        !lower.includes('transmissao') &&
        !lower.includes('onde passa') &&
        !lower.includes('onde ver') &&
        !lower.includes('ao vivo na tv')
      ) {
        return;
      }

      // Procura seção ou parágrafo de "Onde assistir"
      let searchSection = rawContent;
      const matchIndex = rawContent.search(/onde\s+assistir|transmiss[ãa]o/i);
      if (matchIndex !== -1) {
        searchSection = rawContent.substring(matchIndex, matchIndex + 600);
      }

      const secLower = searchSection.toLowerCase();

      // Mapeamento de canais comuns no Brasil
      const tvOpenMatches: string[] = [];
      if (secLower.includes('globo') || secLower.includes('tv globo')) tvOpenMatches.push('TV Globo');
      if (secLower.includes('sbt')) tvOpenMatches.push('SBT');
      if (secLower.includes('band') || secLower.includes('rede bandeirantes')) tvOpenMatches.push('Band');
      if (secLower.includes('record')) tvOpenMatches.push('Record');

      const tvClosedMatches: string[] = [];
      if (secLower.includes('sportv') || secLower.includes('spor tv')) tvClosedMatches.push('SporTV');
      if (secLower.includes('premiere')) tvClosedMatches.push('Premiere');
      if (secLower.includes('espn')) tvClosedMatches.push('ESPN');
      if (secLower.includes('tnt') || secLower.includes('tnt sports')) tvClosedMatches.push('TNT');
      if (secLower.includes('space')) tvClosedMatches.push('Space');
      if (secLower.includes('bandsports')) tvClosedMatches.push('BandSports');

      const streamingMatches: string[] = [];
      if (secLower.includes('max') || secLower.includes('hbo max')) streamingMatches.push('Max');
      if (secLower.includes('cazétv') || secLower.includes('caze tv') || secLower.includes('cazetv')) streamingMatches.push('CazéTV');
      if (secLower.includes('globoplay') || secLower.includes('globo play')) streamingMatches.push('Globoplay');
      if (secLower.includes('disney+') || secLower.includes('disney plus')) streamingMatches.push('Disney+');
      if (secLower.includes('prime video') || secLower.includes('amazon prime')) streamingMatches.push('Prime Video');
      if (secLower.includes('paramount+') || secLower.includes('paramount plus')) streamingMatches.push('Paramount+');
      if (secLower.includes('premiere') && !tvClosedMatches.includes('Premiere')) streamingMatches.push('Premiere');

      if (tvOpenMatches.length === 0 && tvClosedMatches.length === 0 && streamingMatches.length === 0) {
        return;
      }

      await this.pbCommentsClient.saveBroadcast({
        fixture_id: fixtureExternalId,
        league_id: leagueExternalId,
        match_title: `${homeTeam} x ${awayTeam}`,
        tv_open: tvOpenMatches.join(', '),
        tv_closed: tvClosedMatches.join(', '),
        streaming: streamingMatches.join(', '),
        details: 'Transmissão ao vivo sujeita a confirmação das emissoras.',
        source_url: sourceUrl || '',
      });
    } catch (err: any) {
      this.logger.warn(`[BroadcastExtractor] Erro ao extrair transmissão para fixture ${fixtureExternalId}: ${err.message}`);
    }
  }

  /**
   * Coleta e ingere informações de transmissão ("Onde Assistir") para uma partida com antecedência
   */
  async ingestBroadcastForFixture(fixtureExternalId: number): Promise<boolean> {
    try {
      // 1. Verifica se já existe no PocketBase com dados preenchidos
      const existing = await this.pbCommentsClient.getBroadcastByFixture(fixtureExternalId);
      if (existing && (existing.tv_open || existing.tv_closed || existing.streaming)) {
        return false; // Já possui canais gravados
      }

      // 2. Busca dados da partida no banco local
      const fixture = await this.prisma.fixture.findFirst({
        where: { externalId: fixtureExternalId },
        include: { homeTeam: true, awayTeam: true, league: true },
      });

      if (!fixture) {
        return false;
      }

      const sources = ['ge.globo.com', 'lance.com.br', 'uol.com.br', 'gazetaesportiva.com', 'espn.com.br'];

      // 3. Tenta descobrir URL pré-jogo de "onde assistir"
      const previewUrl = await this.crawl4aiClient.discoverMatchLiveUrl(
        fixture.homeTeam.name,
        fixture.awayTeam.name,
        sources,
        false,
      );

      if (previewUrl) {
        const rawPreview = await this.crawl4aiClient.crawlSync(previewUrl, {
          timeoutMs: 12000,
          sessionId: `broadcast_${fixtureExternalId}`,
        });
        if (rawPreview) {
          await this.extractAndSaveBroadcastInfo(
            fixtureExternalId,
            fixture.league.externalId,
            fixture.homeTeam.name,
            fixture.awayTeam.name,
            rawPreview,
            previewUrl,
          );
          return true;
        }
      }

      // 4. Fallback: busca via press radar de manchetes esportivas
      const pressRadar = await this.crawl4aiClient.fetchMultiSourcePressRadar(
        fixture.homeTeam.name,
        fixture.awayTeam.name,
        sources,
      );
      if (pressRadar) {
        await this.extractAndSaveBroadcastInfo(
          fixtureExternalId,
          fixture.league.externalId,
          fixture.homeTeam.name,
          fixture.awayTeam.name,
          pressRadar,
          previewUrl || '',
        );
        return true;
      }
    } catch (err: any) {
      this.logger.warn(`[BroadcastIngest] Falha ao coletar transmissão para partida ${fixtureExternalId}: ${err.message}`);
    }
    return false;
  }
}
