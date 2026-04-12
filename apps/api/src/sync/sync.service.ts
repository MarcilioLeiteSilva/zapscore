import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiFootballService } from '../integrations/api-football/api-football.service';
import { PrismaService } from '../prisma/prisma.service';
import { ApiFootballMapper } from '../integrations/api-football/mappers/api-football.mapper';
import { SUPPORTED_COMPETITIONS } from '../config/competitions.config';

@Injectable()
export class SyncService {
  private readonly logger = new Logger(SyncService.name);

  constructor(
    private readonly apiFootball: ApiFootballService,
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  private get defaultLeagueId(): number {
    return parseInt(this.configService.get<string>('DEFAULT_LEAGUE_ID', '71'), 10);
  }

  private get defaultSeason(): number {
    return parseInt(this.configService.get<string>('DEFAULT_SEASON', '2026'), 10);
  }

  async bootstrap(leagueId?: number, season?: number) {
    const targetLeague = leagueId || this.defaultLeagueId;
    const targetSeason = season || this.defaultSeason;

    this.logger.log(`Starting full bootstrap for League ${targetLeague} Season ${targetSeason}`);

    const resLeague = await this.syncLeague(targetLeague, targetSeason);
    const resTeams = await this.syncTeams(targetLeague, targetSeason);
    const resFixtures = await this.syncFixtures(targetLeague, targetSeason);
    const resStandings = await this.syncStandings(targetLeague, targetSeason);

    return {
      success: true,
      scope: {
        leagueId: targetLeague,
        season: targetSeason,
      },
      steps: {
        league: { ok: true, processed: resLeague.count },
        teams: { ok: true, processed: resTeams.count },
        fixtures: { ok: true, processed: resFixtures.count },
        standings: { ok: true, processed: resStandings.count },
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

          const [homeTeam, awayTeam] = await Promise.all([
            this.prisma.team.findUnique({ where: { externalId: data.teams.home.id } }),
            this.prisma.team.findUnique({ where: { externalId: data.teams.away.id } }),
          ]);

          if (!homeTeam || !awayTeam) continue;

          const fixtureMapped = ApiFootballMapper.toFixture(data, league.id, homeTeam.id, awayTeam.id);
          
          await this.prisma.fixture.upsert({
            where: { externalId: fixtureMapped.externalId },
            update: fixtureMapped,
            create: fixtureMapped as any,
          });

          // Se o jogo está LIVE ou FINISHED, sincronizamos os detalhes técnicos
          if (['1H', '2H', 'HT', 'FT', 'LIVE'].includes(data.fixture.status.short)) {
             await this.syncFixtureDetail(data.fixture.id);
          }
        } catch (err) {
          this.logger.error(`Error syncing fixture ${data.fixture.id}: ${err.message}`);
        }
      }

      this.logger.log(`Synced ${fixturesData.length} fixtures for league ${targetLeague}.`);
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
              player: e.player.name,
              assist: e.assist?.name,
              type: e.type,
              detail: e.detail
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

      // 3. Sincronizar Escalações
      const lineups = await this.apiFootball.get('/fixtures/lineups', { fixture: externalFixtureId });
      if (lineups) {
        await this.prisma.fixtureLineup.deleteMany({ where: { fixtureId: fixture.id } });
        for (const l of lineups) {
          const teamId = l.team.id;
          for (const p of l.startXI) {
            await this.prisma.fixtureLineup.create({
              data: {
                fixtureId: fixture.id,
                teamId,
                player: p.player.name,
                number: p.player.number,
                pos: p.player.pos,
                grid: p.player.grid,
                isStart: true
              }
            });
          }
          for (const p of l.substitutes) {
            await this.prisma.fixtureLineup.create({
              data: {
                fixtureId: fixture.id,
                teamId,
                player: p.player.name,
                number: p.player.number,
                pos: p.player.pos,
                isStart: false
              }
            });
          }
        }
      }
    } catch (err) {
      this.logger.error(`Error syncing fixture detail ${externalFixtureId}: ${err.message}`);
    }
  }

  async syncLive(leagueId?: number) {
    const targetLeagues = leagueId ? [leagueId] : SUPPORTED_COMPETITIONS.map(c => c.externalId);
    
    this.logger.log(`Starting live sync for leagues: ${targetLeagues.join(', ')}`);
    
    let totalSynced = 0;
    try {
      for (const leagueId of targetLeagues) {
        this.logger.debug(`Fetching live fixtures for league ${leagueId}`);
        const liveFixtures = await this.apiFootball.getFixtures({ 
           live: 'all',
           league: leagueId
        });

        if (!liveFixtures || liveFixtures.length === 0) continue;

        this.logger.log(`Found ${liveFixtures.length} live matches for league ${leagueId}.`);

        for (const data of liveFixtures) {
        try {
          // Precisamos garantir que a liga e os times existem
          // (Normalmente já existem se o bootstrap foi rodado)
          const league = await this.prisma.league.findUnique({
            where: { externalId: data.league.id }
          });
          if (!league) continue;

          const [homeTeam, awayTeam] = await Promise.all([
            this.prisma.team.findUnique({ where: { externalId: data.teams.home.id } }),
            this.prisma.team.findUnique({ where: { externalId: data.teams.away.id } }),
          ]);
          if (!homeTeam || !awayTeam) continue;

          const fixtureMapped = ApiFootballMapper.toFixture(data, league.id, homeTeam.id, awayTeam.id);
          
          await this.prisma.fixture.upsert({
            where: { externalId: fixtureMapped.externalId },
            update: fixtureMapped,
            create: fixtureMapped as any,
          });

          // Sincronizar detalhes técnicos para jogos ao vivo
          await this.syncFixtureDetail(data.fixture.id);
          totalSynced++;

        } catch (err) {
          this.logger.error(`Error processing live fixture ${data.fixture.id}: ${err.message}`);
        }
      }
    }

      return { count: totalSynced };
    } catch (err) {
      this.logger.error(`Failed live sync: ${err.message}`);
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
}
