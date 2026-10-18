import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiFootballService } from '../integrations/api-football/api-football.service';
import { PrismaService } from '../prisma/prisma.service';
import { ApiFootballMapper } from '../integrations/api-football/mappers/api-football.mapper';
import { SUPPORTED_COMPETITIONS } from '../config/competitions.config';
import { AiSyncService } from '../fixtures/ai-analysis/ai-sync.service';
import { FixturesGateway } from '../fixtures/fixtures.gateway';
import { RedisService } from '../redis/redis.service';
import { ScorerAgentService } from '../competitions/scorer-agent.service';

@Injectable()
export class SyncService {
  private readonly logger = new Logger(SyncService.name);

  constructor(
    private readonly apiFootball: ApiFootballService,
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly aiSyncService: AiSyncService,
    private readonly fixturesGateway: FixturesGateway,
    private readonly redis: RedisService,
    private readonly scorerAgent: ScorerAgentService,
  ) {}

  private get defaultLeagueId(): number {
    return parseInt(this.configService.get<string>('DEFAULT_LEAGUE_ID', '71'), 10);
  }

  private get defaultSeason(): number {
    return parseInt(this.configService.get<string>('DEFAULT_SEASON', '2026'), 10);
  }

  /**
   * Proteção Não-Regressiva: impede que um sync atrasado com status 'NS'
   * sobrescreva uma partida que já foi encerrada ('FT', 'AET', 'PEN') localmente.
   */
  private async safeUpsertFixture(fixtureMapped: any) {
    const existing = await this.prisma.fixture.findUnique({
      where: { externalId: fixtureMapped.externalId },
      select: { statusShort: true, homeGoals: true, awayGoals: true },
    });

    let updatePayload = fixtureMapped;
    if (existing && ['FT', 'AET', 'PEN'].includes(existing.statusShort || '')) {
      if (fixtureMapped.statusShort === 'NS') {
        const { statusShort, statusLong, elapsed, homeGoals, awayGoals, ...rest } = fixtureMapped;
        updatePayload = rest;
      }
    }

    return this.prisma.fixture.upsert({
      where: { externalId: fixtureMapped.externalId },
      update: updatePayload,
      create: fixtureMapped as any,
    });
  }

  async bootstrap(leagueId?: number, season?: number) {
    const targetLeagues = leagueId ? [leagueId] : SUPPORTED_COMPETITIONS.map(c => c.externalId);
    const targetSeason = season || this.defaultSeason;

    this.logger.log(`Starting full bootstrap for leagues: ${targetLeagues.join(', ')} Season ${targetSeason}`);

    for (const id of targetLeagues) {
      try {
        await this.syncLeague(id, targetSeason);
        await this.syncTeams(id, targetSeason);
        await this.syncFixtures(id, targetSeason);
        await this.syncStandings(id, targetSeason);
        await this.syncScorers(id, targetSeason);
      } catch (err) {
        this.logger.error(`Error bootstrapping league ${id}: ${err.message}`);
      }
    }

    return {
      success: true,
      scope: {
        leagues: targetLeagues,
        season: targetSeason,
      },
      finishedAt: new Date().toISOString(),
    };
  }

  async syncLeague(leagueId?: number, season?: number) {
    const targetLeague = leagueId || this.defaultLeagueId;
    const targetSeason = season || this.defaultSeason;

    this.logger.log(`Syncing league ${targetLeague} for season ${targetSeason}...`);
    const leaguesData = await this.apiFootball.getLeagues({ id: targetLeague });
    
    let count = 0;
    for (const data of leaguesData) {
      if (data.league.id === targetLeague) {
        const leagueMapped = ApiFootballMapper.toLeague({
            ...data,
            seasons: [{ year: targetSeason, current: true }]
        });
        await this.prisma.league.upsert({
          where: { externalId: leagueMapped.externalId },
          update: leagueMapped,
          create: leagueMapped as any,
        });
        count++;
      }
    }
    
    return { count };
  }

  async syncTeams(leagueId?: number, season?: number) {
    const targetLeague = leagueId || this.defaultLeagueId;
    const targetSeason = season || this.defaultSeason;

    this.logger.log(`Syncing teams for league ${targetLeague} season ${targetSeason}...`);
    const teamsData = await this.apiFootball.getTeams({ league: targetLeague, season: targetSeason });
    
    let count = 0;
    for (const data of teamsData) {
      const teamMapped = ApiFootballMapper.toTeam(data);
      await this.prisma.team.upsert({
        where: { externalId: teamMapped.externalId },
        update: teamMapped,
        create: teamMapped as any,
      });
      count++;
    }
    
    return { count };
  }

  async syncByExternalId(externalId: number) {
    this.logger.log(`Manual sync requested for fixture ${externalId}`);
    try {
      const fixtureData = await this.apiFootball.getFixtures({ id: externalId });
      if (!fixtureData || fixtureData.length === 0) {
        throw new Error(`Fixture ${externalId} not found in API-Football`);
      }

      const data = fixtureData[0];
      const league = await this.prisma.league.findUnique({
        where: { externalId: data.league.id }
      });

      if (!league) {
        // Se a liga não existe, sincroniza ela primeiro
        await this.syncLeague(data.league.id, data.league.season);
      }

      const [homeTeam, awayTeam] = await Promise.all([
        this.prisma.team.findUnique({ where: { externalId: data.teams.home.id } }),
        this.prisma.team.findUnique({ where: { externalId: data.teams.away.id } }),
      ]);

      if (!homeTeam) await this.syncTeams(data.league.id, data.league.season);
      if (!awayTeam) await this.syncTeams(data.league.id, data.league.season);

      // Busca novamente após sincronizar dependências se necessário
      const [finalHome, finalAway] = await Promise.all([
        this.prisma.team.findUnique({ where: { externalId: data.teams.home.id } }),
        this.prisma.team.findUnique({ where: { externalId: data.teams.away.id } }),
      ]);

      if (!finalHome || !finalAway) {
        throw new Error(`Failed to sync teams for fixture ${externalId}`);
      }

      const finalLeague = await this.prisma.league.findUnique({ where: { externalId: data.league.id } });
      if (!finalLeague) {
        throw new Error(`Failed to sync league ${data.league.id} for fixture ${externalId}`);
      }
      const fixtureMapped = ApiFootballMapper.toFixture(data, finalLeague.id, finalHome.id, finalAway.id);
      
      await this.safeUpsertFixture(fixtureMapped);

      await this.syncFixtureDetail(externalId);
      return { success: true };
    } catch (err) {
      this.logger.error(`Error in syncByExternalId ${externalId}: ${err.message}`);
      throw err;
    }
  }

  async syncFixtures(leagueId?: number, season?: number) {
    const targetLeague = leagueId || this.defaultLeagueId;
    const targetSeason = season || this.defaultSeason;

    this.logger.log(`Syncing fixtures for league ${targetLeague} season ${targetSeason}...`);
    try {
      const fixturesData = await this.apiFootball.getFixtures({ league: targetLeague, season: targetSeason });
      
      for (const data of fixturesData) {
        try {
          const league = await this.prisma.league.findUnique({
            where: { externalId: data.league.id }
          });

          if (!league) continue;

          let homeTeam = await this.prisma.team.findUnique({ where: { externalId: data.teams.home.id } });
          if (!homeTeam) {
            homeTeam = await this.prisma.team.upsert({
              where: { externalId: data.teams.home.id },
              update: { name: data.teams.home.name, logo: data.teams.home.logo },
              create: {
                externalId: data.teams.home.id,
                name: data.teams.home.name,
                logo: data.teams.home.logo,
                country: data.teams.home.country || 'Brazil',
              },
            });
          }

          let awayTeam = await this.prisma.team.findUnique({ where: { externalId: data.teams.away.id } });
          if (!awayTeam) {
            awayTeam = await this.prisma.team.upsert({
              where: { externalId: data.teams.away.id },
              update: { name: data.teams.away.name, logo: data.teams.away.logo },
              create: {
                externalId: data.teams.away.id,
                name: data.teams.away.name,
                logo: data.teams.away.logo,
                country: data.teams.away.country || 'Brazil',
              },
            });
          }

          const fixtureMapped = ApiFootballMapper.toFixture(data, league.id, homeTeam.id, awayTeam.id);
          
          await this.safeUpsertFixture(fixtureMapped);

          // Se o jogo está LIVE ou FINISHED, sincronizamos os detalhes técnicos
          if (['1H', '2H', 'HT', 'FT', 'LIVE', 'AET', 'PEN', 'BT', 'SUSP', 'INT'].includes(data.fixture.status.short)) {
             await this.syncFixtureDetail(data.fixture.id);
          }
        } catch (err) {
          this.logger.error(`Error syncing fixture ${data.fixture.id}: ${err.message}`);
        }
      }

      this.logger.log(`Synced ${fixturesData.length} fixtures for league ${targetLeague}.`);
      await this.redis.delPattern('fixtures:*');
      return { count: fixturesData.length };
    } catch (err) {
      this.logger.error(`Failed to sync fixtures: ${err.message}`);
      throw err;
    }
  }

  async syncFixtureDetail(externalFixtureId: number) {
    this.logger.log(`Syncing details for fixture ${externalFixtureId}...`);
    
    const fixture = await this.prisma.fixture.findUnique({ where: { externalId: externalFixtureId } });
    if (!fixture) return;

    try {
      // 1. Sincronizar Eventos
      const events = await this.apiFootball.get('/fixtures/events', { fixture: externalFixtureId });
      if (events) {
        await this.prisma.fixtureEvent.deleteMany({ where: { fixtureId: fixture.id } });
        for (const e of events) {
          await this.prisma.fixtureEvent.create({
            data: {
              fixtureId: fixture.id,
              time: e.time.elapsed,
              teamId: e.team.id,
              player: e.player?.name,
              assist: e.assist?.name,
              type: e.type,
              detail: e.detail,
              playerPhoto: e.player?.photo || (e.player?.id ? `https://media.api-sports.io/football/players/${e.player.id}.png` : null),
              externalPlayerId: e.player?.id
            }
          });
        }
      }

      // 2. Sincronizar Estatísticas
      const stats = await this.apiFootball.get('/fixtures/statistics', { fixture: externalFixtureId });
      if (stats) {
        for (const s of stats) {
          const teamId = s.team.id;
          for (const st of s.statistics) {
            await this.prisma.fixtureStat.upsert({
              where: { fixtureId_teamId_type: { fixtureId: fixture.id, teamId, type: st.type } },
              update: { value: String(st.value || '0') },
              create: { fixtureId: fixture.id, teamId, type: st.type, value: String(st.value || '0') }
            });
          }
        }
      }

      // 3. Sincronizar Escalações (Otimizado: apenas busca se não tivermos ou se o jogo ainda não começou)
      const isMatchStarted = !['NS', 'TBD'].includes(fixture.statusShort || '');
      const hasLineups = await this.prisma.fixtureLineup.count({
        where: { fixtureId: fixture.id }
      }) > 0;

      if (!hasLineups || !isMatchStarted) {
        const lineups = await this.apiFootball.get('/fixtures/lineups', { fixture: externalFixtureId });
        if (lineups && lineups.length > 0) {
          await this.prisma.fixtureLineup.deleteMany({ where: { fixtureId: fixture.id } });
          for (const l of lineups) {
            const teamId = l.team.id;
            if (l.startXI && l.startXI.length > 0) {
              for (const p of l.startXI) {
                await this.prisma.fixtureLineup.create({
                  data: {
                    fixtureId: fixture.id,
                    teamId,
                    player: p.player.name,
                    number: p.player.number,
                    pos: p.player.pos,
                    grid: p.player.grid,
                    isStart: true,
                    playerPhoto: p.player.photo || (p.player.id ? `https://media.api-sports.io/football/players/${p.player.id}.png` : null),
                    externalPlayerId: p.player.id
                  }
                });
              }
            }
            if (l.substitutes && l.substitutes.length > 0) {
              for (const p of l.substitutes) {
                await this.prisma.fixtureLineup.create({
                  data: {
                    fixtureId: fixture.id,
                    teamId,
                    player: p.player.name,
                    number: p.player.number,
                    pos: p.player.pos,
                    isStart: false,
                    playerPhoto: p.player.photo || (p.player.id ? `https://media.api-sports.io/football/players/${p.player.id}.png` : null),
                    externalPlayerId: p.player.id
                  }
                });
              }
            }
          }
        }
      }

      // 4. Sincronizar ou Resolver Previsão da IA (assíncrono para evitar gargalos)
      const FINISHED_STATUSES = ['FT', 'AET', 'PEN'];
      if (FINISHED_STATUSES.includes(fixture.statusShort || '')) {
        this.aiSyncService.resolveFixtureAnalysis(fixture.id).catch(err => {
          this.logger.error(`Error resolving AI prediction for fixture ${fixture.id}: ${err.message}`);
        });

        // 4.1 Micro-sync pós-jogo da artilharia para atualização instantânea no app
        this.scorerAgent.aggregateLeagueScorers(fixture.leagueId, fixture.season).catch(err => {
          this.logger.warn(`Post-match scorer auto-sync warning for fixture ${fixture.id}: ${err.message}`);
        });
      } else {
        this.aiSyncService.syncFixtureAnalysis(fixture.id).catch(err => {
          this.logger.error(`Error triggering AI prediction for fixture ${fixture.id}: ${err.message}`);
        });
      }

      // 5. Emitir atualização via WebSocket
      const fullFixture = await this.prisma.fixture.findUnique({
        where: { id: fixture.id },
        include: {
          homeTeam: true,
          awayTeam: true,
          league: true,
          events: true,
          stats: true,
          lineups: true,
        },
      });

      if (fullFixture) {
        this.fixturesGateway.emitFixtureUpdate(fullFixture.id, fullFixture);
        this.fixturesGateway.emitLeagueUpdate(fullFixture.league.externalId, fullFixture);
        this.logger.log(`WebSocket update emitted for fixture ${fullFixture.id} (${fullFixture.homeTeam.name} x ${fullFixture.awayTeam.name})`);
      }
    } catch (err) {
      this.logger.error(`Error syncing fixture detail ${externalFixtureId}: ${err.message}`);
    }
  }

  async syncLive(leagueId?: number) {
    const targetLeagues = leagueId ? [leagueId] : SUPPORTED_COMPETITIONS.map(c => c.externalId);
    this.logger.log(`Starting optimized live sync for leagues: ${targetLeagues.join(', ')}`);
    
    let totalSynced = 0;
    try {
      // 1. Fetch all live matches globally in a single call
      const liveFixtures = (await this.apiFootball.getFixtures({ 
         live: 'all'
      })) || [];

      // 2. Filter in-memory by target leagues
      const monitoredLive = liveFixtures.filter((f: any) => targetLeagues.includes(f.league.id));
      this.logger.log(`Found ${monitoredLive.length} live matches (out of ${liveFixtures.length} globally) for our monitored leagues.`);

      for (const data of monitoredLive) {
        try {
          const league = await this.prisma.league.findUnique({ where: { externalId: data.league.id } });
          if (!league) continue;

          const [homeTeam, awayTeam] = await Promise.all([
            this.prisma.team.findUnique({ where: { externalId: data.teams.home.id } }),
            this.prisma.team.findUnique({ where: { externalId: data.teams.away.id } }),
          ]);
          if (!homeTeam || !awayTeam) continue;

          const fixtureMapped = ApiFootballMapper.toFixture(data, league.id, homeTeam.id, awayTeam.id);
          await this.safeUpsertFixture(fixtureMapped);

          await this.syncFixtureDetail(data.fixture.id);
          totalSynced++;
        } catch (err) {
          this.logger.error(`Error processing live fixture ${data.fixture.id}: ${err.message}`);
        }
      }

      // 3. Detect games that were marked LIVE in our DB but are no longer live in the API
      const liveInDb = await this.prisma.fixture.findMany({
        where: {
          league: { externalId: { in: targetLeagues } },
          statusShort: { in: ['1H', '2H', 'HT', 'ET', 'P', 'BT', 'LIVE'] }
        }
      });

      const apiLiveIds = monitoredLive.map((f: any) => f.fixture.id);
      const finishedFixtures = liveInDb.filter(f => !apiLiveIds.includes(f.externalId));

      for (const f of finishedFixtures) {
        this.logger.log(`Detectado fim de jogo provável para fixture ${f.externalId}. Sincronizando status final...`);
        await this.syncByExternalId(f.externalId).catch(err => 
          this.logger.error(`Erro ao sincronizar status final da fixture ${f.externalId}: ${err.message}`)
        );
      }

      return { count: totalSynced };
    } catch (err) {
      this.logger.error(`Failed live sync: ${err.message}`);
      throw err;
    }
  }

  async syncToday() {
    const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' });
    this.logger.log(`Starting full day sync for ${today} (America/Sao_Paulo)...`);
    
    let totalSynced = 0;
    try {
      const monitoredLeagueIds = new Set(SUPPORTED_COMPETITIONS.map(c => c.externalId));

      // 1. Busca todas as partidas do dia globalmente em 1 única chamada à API-Football
      const allTodayFixtures = await this.apiFootball.getFixtures({ 
         date: today,
         timezone: 'America/Sao_Paulo',
      });

      if (!allTodayFixtures || allTodayFixtures.length === 0) {
        this.logger.log(`No fixtures found globally for ${today}`);
        return { count: 0 };
      }

      // 2. Filtra em memória apenas as partidas das nossas ligas monitoradas
      const monitoredFixtures = allTodayFixtures.filter((data: any) =>
        monitoredLeagueIds.has(data.league?.id)
      );

      this.logger.log(`Found ${monitoredFixtures.length} matches today for our monitored leagues (out of ${allTodayFixtures.length} globally).`);

      for (const data of monitoredFixtures) {
        try {
          const league = await this.prisma.league.findUnique({ where: { externalId: data.league.id } });
          if (!league) continue;

          const [homeTeam, awayTeam] = await Promise.all([
            this.prisma.team.findUnique({ where: { externalId: data.teams.home.id } }),
            this.prisma.team.findUnique({ where: { externalId: data.teams.away.id } }),
          ]);
          if (!homeTeam || !awayTeam) continue;

          const fixtureMapped = ApiFootballMapper.toFixture(data, league.id, homeTeam.id, awayTeam.id);
          await this.safeUpsertFixture(fixtureMapped);

          // Apenas sincroniza detalhes técnicos se a partida estiver ao vivo ou recém-finalizada
          if (['1H', '2H', 'HT', 'ET', 'P', 'BT', 'LIVE', 'FT'].includes(data.fixture.status.short)) {
             await this.syncFixtureDetail(data.fixture.id);
          }
          totalSynced++;
        } catch (err) {
          this.logger.error(`Error processing today fixture ${data.fixture.id}: ${err.message}`);
        }
      }
      return { count: totalSynced };
    } catch (err) {
      this.logger.error(`Failed today sync: ${err.message}`);
      throw err;
    }
  }

  async syncStandings(leagueId?: number, season?: number) {
    const targetLeague = leagueId || this.defaultLeagueId;
    const targetSeason = season || this.defaultSeason;

    this.logger.log(`Syncing standings for league ${targetLeague} season ${targetSeason}...`);
    const standingsData = await this.apiFootball.getStandings({ league: targetLeague, season: targetSeason });
    
    if (!standingsData || standingsData.length === 0) return { count: 0 };
    
    const league = await this.prisma.league.findUnique({
      where: { externalId: targetLeague }
    });

    if (!league) return { count: 0 };

    const firstStanding = standingsData[0].league.standings;
    let count = 0;

    for (const group of firstStanding) {
      for (const item of group) {
        // Evitar que rankings comparativos secundários (como "Ranking of third-placed teams")
        // sobrescrevam a classificação principal dos grupos nas copas
        if (item.group && (
          item.group.toLowerCase().includes('ranking of') ||
          item.group.toLowerCase().includes('third-placed') ||
          item.group.toLowerCase().includes('best third')
        )) {
          continue;
        }

        if (!item.team?.id) continue;

        const team = await this.prisma.team.findUnique({
          where: { externalId: item.team.id },
        });

        if (!team) continue;

        const standingMapped = ApiFootballMapper.toStanding(item, league.id, team.id, targetSeason);
        
        await this.prisma.standing.upsert({
          where: {
            leagueId_teamId_season: {
              leagueId: league.id,
              teamId: team.id,
              season: targetSeason
            }
          },
          update: standingMapped as any,
          create: standingMapped as any,
        });
        count++;
      }
    }
    
    return { count };
  }

  async syncScorers(leagueId?: number, season?: number) {
    const targetLeague = leagueId || this.defaultLeagueId;
    const targetSeason = season || this.defaultSeason;

    this.logger.log(`Syncing scorers via ScorerAgent for league ${targetLeague} season ${targetSeason}...`);
    try {
      const result = await this.scorerAgent.aggregateLeagueScorers(targetLeague, targetSeason);
      return { count: result.topScorersCount, source: result.source };
    } catch (err: any) {
      this.logger.error(`Error in syncScorers for league ${targetLeague}: ${err.message}`);
      return { count: 0, error: err.message };
    }
  }

  async repairPhotos() {
    this.logger.log('Starting photo repair for lineups and events...');
    
    const lineups = await this.prisma.fixtureLineup.findMany({
      where: { 
        OR: [
          { playerPhoto: null },
          { playerPhoto: '' }
        ],
        externalPlayerId: { not: null } 
      }
    });

    let lineupsFixed = 0;
    for (const l of lineups) {
      await this.prisma.fixtureLineup.update({
        where: { id: l.id },
        data: { playerPhoto: `https://media.api-sports.io/football/players/${l.externalPlayerId}.png` }
      });
      lineupsFixed++;
    }

    const events = await this.prisma.fixtureEvent.findMany({
      where: { 
        OR: [
          { playerPhoto: null },
          { playerPhoto: '' }
        ],
        externalPlayerId: { not: null } 
      }
    });

    let eventsFixed = 0;
    for (const e of events) {
      await this.prisma.fixtureEvent.update({
        where: { id: e.id },
        data: { playerPhoto: `https://media.api-sports.io/football/players/${e.externalPlayerId}.png` }
      });
      eventsFixed++;
    }

    this.logger.log(`Photo repair finished. Fixed ${lineupsFixed} lineups and ${eventsFixed} events.`);
    
    return { 
      lineupsFixed, 
      eventsFixed 
    };
  }

  async testApiFootballConnection() {
    const rawKey = this.configService.get<string>('API_FOOTBALL_KEY') || '';
    const maskedRawKey = rawKey ? (rawKey.substring(0, 4) + '...' + rawKey.substring(rawKey.length - 4)) : 'NOT_DEFINED';
    
    const actualKey = this.apiFootball.apiKey || '';
    const maskedActualKey = actualKey ? (actualKey.substring(0, 4) + '...' + actualKey.substring(actualKey.length - 4)) : 'NOT_DEFINED';
    
    this.logger.log(`Testing API-Football connection. Raw key: ${maskedRawKey} | Sanitized key: ${maskedActualKey}`);
    try {
      const data = await this.apiFootball.getFixtures({ id: 1520726 });
      return { 
        success: true, 
        maskedRawKey,
        maskedActualKey,
        message: 'Successfully connected to API-Football', 
        fixturesCount: data ? data.length : 0 
      };
    } catch (err: any) {
      const responseData = err.response?.data || null;
      this.logger.error(`API-Football connection test failed: ${err.message}. Response data: ${JSON.stringify(responseData)}`, err.stack);
      return { 
        success: false, 
        maskedRawKey,
        maskedActualKey,
        error: err.message, 
        responseData,
        stack: err.stack 
      };
    }
  }
}

