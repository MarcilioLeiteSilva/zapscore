import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { FixturesGateway } from '../fixtures/fixtures.gateway';
import { FpfDriver } from './drivers/fpf.driver';
import { FederationDriver, StateScoutMatch, StateScoutTelemetry } from './interfaces/state-scout.interface';
import { ApiFootballService } from '../integrations/api-football/api-football.service';
import { resolveTeamAlias, normalizeTeamString } from './config/team-aliases.config';
import { SumulaParserService } from './services/sumula-parser.service';
import { ScorerAgentService } from '../competitions/scorer-agent.service';

@Injectable()
export class StateLeagueScoutService implements OnApplicationBootstrap {
  private readonly logger = new Logger(StateLeagueScoutService.name);
  private readonly drivers = new Map<number, FederationDriver>();

  private telemetry: StateScoutTelemetry = {
    status: 'ONLINE',
    lastRunTimestamp: null,
    lastScheduleReconciledCount: 0,
    lastResultsReconciledCount: 0,
    totalDatesCorrected: 0,
    totalResultsSettled: 0,
    totalSumulasParsed: 0,
    lastMatchdayLiveTimestamp: null,
    activeLiveMatchesCount: 0,
    activeDrivers: [],
    recentLogs: [],
  };

  constructor(
    private readonly prisma: PrismaService,
    private readonly fixturesGateway: FixturesGateway,
    private readonly apiFootball: ApiFootballService,
    private readonly fpfDriver: FpfDriver,
    private readonly sumulaParser: SumulaParserService,
    private readonly scorerAgent: ScorerAgentService,
  ) {
    // Registra drivers disponíveis
    this.registerDriver(this.fpfDriver);
  }

  async onApplicationBootstrap() {
    this.logger.log('[STATE-SCOUT] Inicializando alinhamento autônomo no startup...');
    this.reconcileAll().catch(err => {
      this.logger.warn(`[STATE-SCOUT] Startup reconcile falhou silenciosamente: ${err.message}`);
    });
  }

  /**
   * Cron Autônomo 1: Alinhamento de Calendário (2x ao dia: 06h00 e 14h00 BRT)
   */
  @Cron('0 6,14 * * *')
  async cronReconcileSchedule() {
    this.logger.log('[STATE-SCOUT] Disparando cron autônomo de alinhamento de calendário...');
    await this.reconcileSchedule();
  }

  /**
   * Cron Autônomo 2: Verificação de Placares Finalizados (A cada 15 minutos)
   */
  @Cron('*/15 * * * *')
  async cronReconcileResults() {
    await this.reconcileMatchResults();
  }

  /**
   * Cron Autônomo 3: Matchday Live Daemon (A cada 60s)
   * Monitora rodadas ativas minuto a minuto. Se não houver jogos na janela de hoje, dorme imediatamente.
   */
  @Cron('* * * * *')
  async cronMatchdayLive() {
    await this.processMatchdayLive();
  }

  /**
   * Cron Autônomo 4: Conciliação Deslizante de Jogos Passados (A cada 2 horas)
   * Elimina a espera de 24h, buscando súmulas, escalações e artilharia de jogos recentes.
   */
  @Cron('0 */2 * * *')
  async cronPastGames() {
    await this.reconcilePastGames();
  }

  registerDriver(driver: FederationDriver) {
    this.drivers.set(driver.leagueExternalId, driver);
    this.telemetry.activeDrivers = Array.from(this.drivers.values()).map(d => ({
      name: d.name,
      leagueExternalId: d.leagueExternalId,
      season: d.season,
      status: 'ACTIVE',
    }));
    this.logger.log(`[STATE-SCOUT] Driver registrado com sucesso: ${driver.name} (Liga #${driver.leagueExternalId})`);
  }

  getTelemetry(): StateScoutTelemetry {
    return this.telemetry;
  }

  private addLog(level: 'INFO' | 'WARN' | 'ERROR', message: string) {
    this.telemetry.recentLogs.unshift({
      timestamp: new Date().toISOString(),
      level,
      message,
    });
    if (this.telemetry.recentLogs.length > 50) {
      this.telemetry.recentLogs.pop();
    }
  }

  /**
   * Normaliza strings de nomes de clubes com proteção de stopwords
   */
  private cleanTeamName(name: string): string {
    const norm = normalizeTeamString(name);
    const withoutStopwords = norm
      .replace(/\b(pe|sc|fc|ec|de|do|da|futebol|clube|associacao)\b/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    return withoutStopwords.length >= 3 ? withoutStopwords : norm;
  }

  /**
   * Verifica se o nome do time da federação/GE corresponde ao nome do time no banco
   * Suporta resolução determinística por catálogo de aliases, siglas e fallback seguro.
   */
  private matchesTeam(fedName: string, dbName: string, leagueExternalId?: number): boolean {
    // 1. Tenta resolver via catálogo canônico de aliases e siglas
    const tFed = resolveTeamAlias(fedName, leagueExternalId);
    const tDb = resolveTeamAlias(dbName, leagueExternalId);

    if (tFed && tDb && tFed.externalId === tDb.externalId) return true;
    if (tFed && normalizeTeamString(dbName) === normalizeTeamString(tFed.canonicalName)) return true;
    if (tDb && normalizeTeamString(fedName) === normalizeTeamString(tDb.canonicalName)) return true;

    // 2. Normalização direta exata
    const nFed = normalizeTeamString(fedName);
    const nDb = normalizeTeamString(dbName);
    if (nFed === nDb) return true;

    // 3. Fallback inteligente sem perda de stopwords curtas
    const cFed = this.cleanTeamName(fedName);
    const cDb = this.cleanTeamName(dbName);

    if (!cFed || !cDb) return false;
    return cFed === cDb || cDb.includes(cFed) || cFed.includes(cDb);
  }

  /**
   * Loop 1: Auto-Alinhamento de Calendário (Datas, Rodadas e Estádios)
   */
  async reconcileSchedule(targetLeagueId?: number): Promise<{ updatedCount: number; details: string[] }> {
    this.logger.log(`[STATE-SCOUT] Iniciando ciclo autônomo de alinhamento de calendário...`);
    let updatedCount = 0;
    const details: string[] = [];

    const driversToRun = targetLeagueId
      ? (this.drivers.has(targetLeagueId) ? [this.drivers.get(targetLeagueId)!] : [])
      : Array.from(this.drivers.values());

    for (const driver of driversToRun) {
      try {
        const fedMatches = await driver.fetchSchedule();
        if (fedMatches.length === 0) continue;

        // Busca todas as partidas da liga no PostgreSQL
        const dbFixtures = await this.prisma.fixture.findMany({
          where: {
            league: { externalId: driver.leagueExternalId },
            season: driver.season,
          },
          include: {
            homeTeam: true,
            awayTeam: true,
            league: true,
          },
        });

        for (const fedMatch of fedMatches) {
          // Localiza a partida correspondente no banco com suporte a aliases
          const matchingFixture = dbFixtures.find(f =>
            this.matchesTeam(fedMatch.homeTeamName, f.homeTeam.name, driver.leagueExternalId) &&
            this.matchesTeam(fedMatch.awayTeamName, f.awayTeam.name, driver.leagueExternalId)
          );

          if (!matchingFixture) continue;

          // Se a partida ainda não foi finalizada, compara e atualiza dados de calendário
          if (!['FT', 'AET', 'PEN'].includes(matchingFixture.statusShort || '')) {
            const timeDiff = Math.abs(matchingFixture.date.getTime() - fedMatch.date.getTime());
            const needsDateUpdate = timeDiff > 60000; // Diferença maior que 1 minuto
            const needsVenueUpdate = fedMatch.venueName && matchingFixture.venueName !== fedMatch.venueName;
            const needsRoundUpdate = fedMatch.round && matchingFixture.round !== fedMatch.round;

            if (needsDateUpdate || needsVenueUpdate || needsRoundUpdate) {
              await this.prisma.fixture.update({
                where: { id: matchingFixture.id },
                data: {
                  ...(needsDateUpdate && { date: fedMatch.date }),
                  ...(needsVenueUpdate && { venueName: fedMatch.venueName }),
                  ...(needsRoundUpdate && { round: fedMatch.round }),
                },
              });

              updatedCount++;
              const msg = `Data/Local atualizado: ${matchingFixture.homeTeam.name} x ${matchingFixture.awayTeam.name} -> ${fedMatch.date.toISOString()} [${fedMatch.venueName || 'Estádio FPF'}]`;
              details.push(msg);
              this.addLog('INFO', msg);
              this.logger.log(`[STATE-SCOUT] ${msg}`);
            }
          }
        }
      } catch (err: any) {
        this.addLog('ERROR', `Erro no driver ${driver.name}: ${err.message}`);
        this.logger.error(`[STATE-SCOUT] Erro ao alinhar calendário do driver ${driver.name}: ${err.message}`);
      }
    }

    this.telemetry.lastRunTimestamp = new Date().toISOString();
    this.telemetry.lastScheduleReconciledCount = updatedCount;
    this.telemetry.totalDatesCorrected += updatedCount;

    return { updatedCount, details };
  }

  /**
   * Loop 2: Auto-Encerramento de Partidas e Placares (Cascata Tripla)
   */
  async reconcileMatchResults(targetLeagueId?: number): Promise<{ settledCount: number; details: string[] }> {
    this.logger.log(`[STATE-SCOUT] Iniciando ciclo autônomo de encerramento de placares...`);
    let settledCount = 0;
    const details: string[] = [];

    const driversToRun = targetLeagueId
      ? (this.drivers.has(targetLeagueId) ? [this.drivers.get(targetLeagueId)!] : [])
      : Array.from(this.drivers.values());

    for (const driver of driversToRun) {
      try {
        const fedMatches = await driver.fetchSchedule();

        // Busca partidas pendentes cujo horário já passou (início há pelo menos 90 min)
        const ninetyMinutesAgo = new Date(Date.now() - 90 * 60 * 1000);

        const pendingFixtures = await this.prisma.fixture.findMany({
          where: {
            league: { externalId: driver.leagueExternalId },
            season: driver.season,
            statusShort: { in: ['NS', '1H', '2H', 'HT', 'LIVE'] },
            date: { lte: ninetyMinutesAgo },
          },
          include: {
            homeTeam: true,
            awayTeam: true,
            league: true,
          },
        });

        for (const fixture of pendingFixtures) {
          // 1. Tenta obter placar oficial da Federação
          const fedMatch = fedMatches.find(m =>
            this.matchesTeam(m.homeTeamName, fixture.homeTeam.name, driver.leagueExternalId) &&
            this.matchesTeam(m.awayTeamName, fixture.awayTeam.name, driver.leagueExternalId)
          );

          let settledHomeGoals: number | null = null;
          let settledAwayGoals: number | null = null;
          let settledSource = '';

          if (
            fedMatch &&
            fedMatch.isFinished &&
            typeof fedMatch.homeScore === 'number' &&
            typeof fedMatch.awayScore === 'number'
          ) {
            settledHomeGoals = fedMatch.homeScore;
            settledAwayGoals = fedMatch.awayScore;
            settledSource = driver.name;
          } else {
            // 2. Fallback: Checa passivamente se a API-Football já possui resultado final FT
            try {
              const apiData = await this.apiFootball.getFixtures({ id: fixture.externalId });
              if (apiData && apiData.length > 0 && ['FT', 'AET', 'PEN'].includes(apiData[0]?.fixture?.status?.short)) {
                settledHomeGoals = apiData[0].goals.home;
                settledAwayGoals = apiData[0].goals.away;
                settledSource = 'API-Football (FT)';
              }
            } catch (e: any) {
              // Silencioso para não onerar logs
            }
          }

          // Se encontramos resultado definitivo:
          if (settledHomeGoals !== null && settledAwayGoals !== null) {
            const updated = await this.prisma.fixture.update({
              where: { id: fixture.id },
              data: {
                statusShort: 'FT',
                statusLong: 'Match Finished',
                elapsed: 90,
                homeGoals: settledHomeGoals,
                awayGoals: settledAwayGoals,
              },
              include: {
                homeTeam: true,
                awayTeam: true,
                league: true,
              },
            });

            settledCount++;
            const logMsg = `Auto-Finalizado via ${settledSource}: ${fixture.homeTeam.name} ${settledHomeGoals} x ${settledAwayGoals} ${fixture.awayTeam.name} (FT)`;
            details.push(logMsg);
            this.addLog('INFO', logMsg);
            this.logger.log(`[STATE-SCOUT] ${logMsg}`);

            // Emite WebSocket para os apps móveis
            this.fixturesGateway.emitFixtureUpdate(updated.id, updated);
            this.fixturesGateway.emitLeagueUpdate(driver.leagueExternalId, updated);

            // Recalcula a tabela de classificação local de forma atômica
            await this.recalculateStandings(fixture.leagueId, driver.season);
            await this.scorerAgent.aggregateLeagueScorers(driver.leagueExternalId, driver.season);

            if (fedMatch?.sumulaUrl) {
              await this.parseAndIngestSumula(
                fixture.id,
                fedMatch.sumulaUrl,
                fixture.homeTeam.externalId,
                fixture.awayTeam.externalId,
              );
            }
          }
        }
      } catch (err: any) {
        this.addLog('ERROR', `Erro ao verificar resultados do driver ${driver.name}: ${err.message}`);
        this.logger.error(`[STATE-SCOUT] Erro ao verificar resultados: ${err.message}`);
      }
    }

    this.telemetry.lastResultsReconciledCount = settledCount;
    this.telemetry.totalResultsSettled += settledCount;

    return { settledCount, details };
  }

  /**
   * Recalcula a tabela de classificação (Standings) com base nas partidas FT do banco
   */
  async recalculateStandings(leagueDbId: string, season: number): Promise<void> {
    try {
      const finishedFixtures = await this.prisma.fixture.findMany({
        where: {
          leagueId: leagueDbId,
          season,
          statusShort: { in: ['FT', 'AET', 'PEN'] },
          homeGoals: { not: null },
          awayGoals: { not: null },
        },
      });

      if (finishedFixtures.length === 0) return;

      const teamStats = new Map<string, {
        played: number;
        win: number;
        draw: number;
        lose: number;
        goalsFor: number;
        goalsAgainst: number;
        goalsDiff: number;
        points: number;
      }>();

      for (const f of finishedFixtures) {
        const hId = f.homeTeamId;
        const aId = f.awayTeamId;
        const hG = f.homeGoals || 0;
        const aG = f.awayGoals || 0;

        if (!teamStats.has(hId)) teamStats.set(hId, { played: 0, win: 0, draw: 0, lose: 0, goalsFor: 0, goalsAgainst: 0, goalsDiff: 0, points: 0 });
        if (!teamStats.has(aId)) teamStats.set(aId, { played: 0, win: 0, draw: 0, lose: 0, goalsFor: 0, goalsAgainst: 0, goalsDiff: 0, points: 0 });

        const h = teamStats.get(hId)!;
        const a = teamStats.get(aId)!;

        h.played++;
        a.played++;
        h.goalsFor += hG;
        h.goalsAgainst += aG;
        h.goalsDiff = h.goalsFor - h.goalsAgainst;

        a.goalsFor += aG;
        a.goalsAgainst += hG;
        a.goalsDiff = a.goalsFor - a.goalsAgainst;

        if (hG > aG) {
          h.win++;
          h.points += 3;
          a.lose++;
        } else if (aG > hG) {
          a.win++;
          a.points += 3;
          h.lose++;
        } else {
          h.draw++;
          a.draw++;
          h.points += 1;
          a.points += 1;
        }
      }

      // Ordena por Pontos desc, Vitórias desc, Saldo de Gols desc, Gols Pró desc
      const sortedTeams = Array.from(teamStats.entries()).sort(([, a], [, b]) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.win !== a.win) return b.win - a.win;
        if (b.goalsDiff !== a.goalsDiff) return b.goalsDiff - a.goalsDiff;
        return b.goalsFor - a.goalsFor;
      });

      let rank = 1;
      for (const [teamId, s] of sortedTeams) {
        await this.prisma.standing.upsert({
          where: {
            leagueId_teamId_season: {
              leagueId: leagueDbId,
              teamId,
              season,
            },
          },
          update: {
            rank,
            points: s.points,
            played: s.played,
            win: s.win,
            draw: s.draw,
            lose: s.lose,
            goalsFor: s.goalsFor,
            goalsAgainst: s.goalsAgainst,
            goalsDiff: s.goalsDiff,
          },
          create: {
            leagueId: leagueDbId,
            teamId,
            season,
            rank,
            points: s.points,
            played: s.played,
            win: s.win,
            draw: s.draw,
            lose: s.lose,
            goalsFor: s.goalsFor,
            goalsAgainst: s.goalsAgainst,
            goalsDiff: s.goalsDiff,
          },
        });
        rank++;
      }

      this.logger.log(`[STATE-SCOUT] Standings recalculados com sucesso para liga ${leagueDbId} (${sortedTeams.length} times).`);
    } catch (e: any) {
      this.logger.error(`[STATE-SCOUT] Falha ao recalcular standings: ${e.message}`);
    }
  }

  /**
   * Baixa a súmula oficial em PDF e faz a ingestão cirúrgica de atletas e gols
   */
  async parseAndIngestSumula(
    fixtureId: string,
    sumulaUrl: string,
    homeTeamExtId: number,
    awayTeamExtId: number,
  ): Promise<boolean> {
    try {
      const existingLineups = await this.prisma.fixtureLineup.count({ where: { fixtureId } });
      if (existingLineups > 0) return false;

      const parsed = await this.sumulaParser.parseFromUrl(sumulaUrl);
      if (!parsed || (parsed.homeTeam.starters.length === 0 && parsed.awayTeam.starters.length === 0)) {
        return false;
      }

      const lineupsToCreate: Array<{
        fixtureId: string;
        teamId: number;
        player: string;
        number?: number;
        pos?: string;
        isStart: boolean;
      }> = [];

      for (let idx = 0; idx < parsed.homeTeam.starters.length; idx++) {
        const p = parsed.homeTeam.starters[idx];
        lineupsToCreate.push({
          fixtureId,
          teamId: homeTeamExtId,
          player: p.name,
          number: p.number,
          pos: idx === 0 ? 'G' : 'M',
          isStart: true,
        });
      }
      for (const p of parsed.homeTeam.substitutes) {
        lineupsToCreate.push({
          fixtureId,
          teamId: homeTeamExtId,
          player: p.name,
          number: p.number,
          pos: 'M',
          isStart: false,
        });
      }

      for (let idx = 0; idx < parsed.awayTeam.starters.length; idx++) {
        const p = parsed.awayTeam.starters[idx];
        lineupsToCreate.push({
          fixtureId,
          teamId: awayTeamExtId,
          player: p.name,
          number: p.number,
          pos: idx === 0 ? 'G' : 'M',
          isStart: true,
        });
      }
      for (const p of parsed.awayTeam.substitutes) {
        lineupsToCreate.push({
          fixtureId,
          teamId: awayTeamExtId,
          player: p.name,
          number: p.number,
          pos: 'M',
          isStart: false,
        });
      }

      for (const item of lineupsToCreate) {
        await this.prisma.fixtureLineup.create({ data: item });
      }

      // Ingestão de gols da súmula se a partida não tiver eventos
      const existingEvents = await this.prisma.fixtureEvent.count({ where: { fixtureId } });
      if (existingEvents === 0 && parsed.goals.length > 0) {
        for (const g of parsed.goals) {
          const isHome = this.matchesTeam(g.teamName, parsed.homeTeam.name);
          const targetTeamId = isHome ? homeTeamExtId : awayTeamExtId;
          let elapsed = parseInt(g.minute.replace('+', ''), 10);
          if (isNaN(elapsed)) elapsed = 45;
          if (g.half === '2' || g.half === '2T') elapsed = Math.max(elapsed, 45);

          await this.prisma.fixtureEvent.create({
            data: {
              fixtureId,
              teamId: targetTeamId,
              time: elapsed,
              player: g.playerName,
              type: 'Goal',
              detail: 'Normal Goal',
            },
          });
        }
      }

      if (this.telemetry.totalSumulasParsed !== undefined) {
        this.telemetry.totalSumulasParsed++;
      }
      this.logger.log(`[STATE-SCOUT] Súmula oficial ingerida com sucesso para fixture ${fixtureId} (${lineupsToCreate.length} atletas).`);
      return true;
    } catch (err: any) {
      this.logger.warn(`[STATE-SCOUT] Falha ao ingerir súmula de ${sumulaUrl}: ${err.message}`);
      return false;
    }
  }

  /**
   * Loop 3: Matchday Live Daemon (Executado a cada 60s)
   * Avalia partidas na janela ativa de hoje: 15 min antes até 135 min após início.
   */
  async processMatchdayLive(): Promise<{ liveScannedCount: number; deltaCount: number }> {
    const now = new Date();
    const windowStart = new Date(now.getTime() - 135 * 60 * 1000);
    const windowEnd = new Date(now.getTime() + 15 * 60 * 1000);

    const activeFixtures = await this.prisma.fixture.findMany({
      where: {
        league: { externalId: { in: Array.from(this.drivers.keys()) } },
        date: { gte: windowStart, lte: windowEnd },
        statusShort: { in: ['NS', '1H', '2H', 'HT', 'LIVE'] },
      },
      include: {
        homeTeam: true,
        awayTeam: true,
        league: true,
      },
    });

    this.telemetry.lastMatchdayLiveTimestamp = now.toISOString();
    this.telemetry.activeLiveMatchesCount = activeFixtures.length;

    if (activeFixtures.length === 0) {
      return { liveScannedCount: 0, deltaCount: 0 };
    }

    this.logger.log(`[STATE-SCOUT Matchday Live ⚽] Avaliando ${activeFixtures.length} partidas ativas na janela...`);
    let deltaCount = 0;

    for (const driver of this.drivers.values()) {
      try {
        const liveMatches = driver.fetchLiveScores
          ? await driver.fetchLiveScores()
          : await driver.fetchSchedule();

        for (const fixture of activeFixtures.filter((f) => f.league.externalId === driver.leagueExternalId)) {
          const match = liveMatches.find((m) =>
            this.matchesTeam(m.homeTeamName, fixture.homeTeam.name, driver.leagueExternalId) &&
            this.matchesTeam(m.awayTeamName, fixture.awayTeam.name, driver.leagueExternalId),
          );

          if (!match) continue;

          if (match.homeScore !== null && match.awayScore !== null) {
            const scoreChanged =
              fixture.homeGoals !== match.homeScore || fixture.awayGoals !== match.awayScore;
            const newStatus = match.isFinished ? 'FT' : 'LIVE';
            const statusChanged = fixture.statusShort !== newStatus;

            if (scoreChanged || statusChanged) {
              const updated = await this.prisma.fixture.update({
                where: { id: fixture.id },
                data: {
                  homeGoals: match.homeScore,
                  awayGoals: match.awayScore,
                  statusShort: newStatus,
                  statusLong: match.isFinished ? 'Match Finished' : 'In Progress',
                  ...(match.isFinished && { elapsed: 90 }),
                },
                include: { homeTeam: true, awayTeam: true, league: true },
              });

              deltaCount++;
              const deltaMsg = `[LIVE DELTA] ${fixture.homeTeam.name} ${match.homeScore} x ${match.awayScore} ${fixture.awayTeam.name} (${newStatus})`;
              this.logger.log(`[STATE-SCOUT] ${deltaMsg}`);
              this.addLog('INFO', deltaMsg);

              // Emite atualização via WebSocket para os apps móveis
              this.fixturesGateway.emitFixtureUpdate(updated.id, updated);
              this.fixturesGateway.emitLeagueUpdate(driver.leagueExternalId, updated);

              // Se a partida encerrou agora
              if (match.isFinished) {
                await this.recalculateStandings(fixture.leagueId, driver.season);
                await this.scorerAgent.aggregateLeagueScorers(driver.leagueExternalId, driver.season);
                if (match.sumulaUrl) {
                  await this.parseAndIngestSumula(
                    fixture.id,
                    match.sumulaUrl,
                    fixture.homeTeam.externalId,
                    fixture.awayTeam.externalId,
                  );
                }
              }
            }
          }
        }
      } catch (err: any) {
        this.logger.error(`[STATE-SCOUT] Erro no Matchday Live do driver ${driver.name}: ${err.message}`);
      }
    }

    return { liveScannedCount: activeFixtures.length, deltaCount };
  }

  /**
   * Loop 4: Conciliação de Jogos Passados (Elimina a espera de 24h)
   * Varre todas as partidas FT da temporada, baixa súmulas oficiais, popula escalações,
   * eventos de gols, e atualiza classificação e artilharia.
   */
  async reconcilePastGames(targetLeagueId?: number): Promise<{
    processedMatchesCount: number;
    lineupsPopulatedCount: number;
    goalsRecordedCount: number;
    details: string[];
  }> {
    this.logger.log(`[STATE-SCOUT] 🚀 Iniciando conciliação rápida de jogos passados (sem espera de 24h)...`);
    let processedCount = 0;
    let lineupsCount = 0;
    let goalsCount = 0;
    const details: string[] = [];

    const driversToRun = targetLeagueId
      ? (this.drivers.has(targetLeagueId) ? [this.drivers.get(targetLeagueId)!] : [])
      : Array.from(this.drivers.values());

    for (const driver of driversToRun) {
      try {
        const fedMatches = await driver.fetchSchedule();
        if (fedMatches.length === 0) continue;

        const fixtures = await this.prisma.fixture.findMany({
          where: {
            league: { externalId: driver.leagueExternalId },
            season: driver.season,
          },
          include: {
            homeTeam: true,
            awayTeam: true,
            lineups: true,
            events: true,
          },
        });

        for (const fedMatch of fedMatches) {
          const fixture = fixtures.find((f) =>
            this.matchesTeam(fedMatch.homeTeamName, f.homeTeam.name, driver.leagueExternalId) &&
            this.matchesTeam(fedMatch.awayTeamName, f.awayTeam.name, driver.leagueExternalId),
          );

          if (!fixture) continue;

          // Se a partida está finalizada na federação, garante placar e FT
          if (fedMatch.isFinished && fedMatch.homeScore !== null && fedMatch.awayScore !== null) {
            if (
              fixture.statusShort !== 'FT' ||
              fixture.homeGoals !== fedMatch.homeScore ||
              fixture.awayGoals !== fedMatch.awayScore
            ) {
              await this.prisma.fixture.update({
                where: { id: fixture.id },
                data: {
                  statusShort: 'FT',
                  statusLong: 'Match Finished',
                  elapsed: 90,
                  homeGoals: fedMatch.homeScore,
                  awayGoals: fedMatch.awayScore,
                },
              });
              details.push(
                `Placar consolidado para FT: ${fixture.homeTeam.name} ${fedMatch.homeScore} x ${fedMatch.awayScore} ${fixture.awayTeam.name}`,
              );
            }
          }

          // Se tiver link de súmula e a partida ainda não tem escalação no banco
          if (fedMatch.sumulaUrl && fixture.lineups.length === 0) {
            const ingested = await this.parseAndIngestSumula(
              fixture.id,
              fedMatch.sumulaUrl,
              fixture.homeTeam.externalId,
              fixture.awayTeam.externalId,
            );
            if (ingested) {
              lineupsCount++;
              details.push(
                `Escalação oficial inserida via súmula: ${fixture.homeTeam.name} x ${fixture.awayTeam.name}`,
              );
            }
          }

          processedCount++;
        }

        // Recalcula classificação dos grupos e artilharia oficial
        if (fixtures.length > 0) {
          await this.recalculateStandings(fixtures[0].leagueId, driver.season);
          await this.scorerAgent.aggregateLeagueScorers(driver.leagueExternalId, driver.season);
        }
      } catch (err: any) {
        this.addLog('ERROR', `Erro na conciliação de jogos passados do driver ${driver.name}: ${err.message}`);
      }
    }

    return {
      processedMatchesCount: processedCount,
      lineupsPopulatedCount: lineupsCount,
      goalsRecordedCount: goalsCount,
      details,
    };
  }

  /**
   * Executa a conciliação completa (Calendário + Placares)
   */
  async reconcileAll(targetLeagueId?: number) {
    const scheduleRes = await this.reconcileSchedule(targetLeagueId);
    const resultsRes = await this.reconcileMatchResults(targetLeagueId);

    return {
      success: true,
      updatedScheduleCount: scheduleRes.updatedCount,
      settledResultsCount: resultsRes.settledCount,
      details: [...scheduleRes.details, ...resultsRes.details],
    };
  }
}
