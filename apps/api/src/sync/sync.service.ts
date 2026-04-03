import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiFootballService } from '../integrations/api-football/api-football.service';
import { PrismaService } from '../prisma/prisma.service';
import { ApiFootballMapper } from '../integrations/api-football/mappers/api-football.mapper';

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

  async syncLeague(leagueId?: number, season?: number) {
    const targetLeague = leagueId || this.defaultLeagueId;
    const targetSeason = season || this.defaultSeason;

    this.logger.log(`Syncing league ${targetLeague} for season ${targetSeason}...`);
    // Filter specifically the target league to avoid mass payload processing if possible
    const leaguesData = await this.apiFootball.getLeagues({ id: targetLeague });
    
    let count = 0;
    for (const data of leaguesData) {
      if (data.league.id === targetLeague) {
        const leagueMapped = ApiFootballMapper.toLeague({
            ...data,
            // Override season to current target if it's returning all seasons array
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
    
    this.logger.log(`Synced ${count} league data for ID: ${targetLeague}`);
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
    
    this.logger.log(`Synced ${count} teams for league ${targetLeague}`);
    return { count };
  }

  async syncFixtures(leagueId?: number, season?: number) {
    const targetLeague = leagueId || this.defaultLeagueId;
    const targetSeason = season || this.defaultSeason;

    this.logger.log(`Syncing fixtures for league ${targetLeague} season ${targetSeason}...`);
    const fixturesData = await this.apiFootball.getFixtures({ league: targetLeague, season: targetSeason });
    
    let count = 0;
    for (const data of fixturesData) {
      try {
        let league = await this.prisma.league.findUnique({
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
        count++;
      } catch (err) {
        this.logger.error(`Error syncing fixture ${data.fixture.id}: ${err.message}`);
      }
    }
    
    this.logger.log(`Synced ${count} fixtures for league ${targetLeague}`);
    return { count };
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
    
    this.logger.log(`Synced ${count} standing entries for league ${targetLeague}`);
    return { count };
  }
}
