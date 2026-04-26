import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SUPPORTED_COMPETITIONS } from '../config/competitions.config';

@Injectable()
export class TeamsService {
  constructor(private readonly prisma: PrismaService) {}

  async findMany(params: {
    leagueId?: number;
    season?: number;
    search?: string;
  }) {
    const { leagueId, season, search } = params;

    const where: any = {};
    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }

    // Filter to only include teams from supported competitions
    const activeLeagueIds = SUPPORTED_COMPETITIONS.map((c) => c.externalId);

    if (leagueId) {
      // Find teams that were in standings for that specific league
      const standingTeams = await this.prisma.standing.findMany({
        where: { league: { externalId: leagueId }, season: season || 2026 },
        select: { team: true },
      });
      return standingTeams.map((s) => s.team);
    }

    // If no leagueId is specified, restrict search to teams in any supported competition
    where.standings = {
      some: {
        league: {
          externalId: { in: activeLeagueIds },
        },
      },
    };

    return this.prisma.team.findMany({
      where,
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    return this.prisma.team.findUnique({
      where: { id },
    });
  }

  async getTeamStats(teamExternalId: number, leagueExternalId: number, season: number = 2026) {
    // 1. Try to find aggregated statistics in TeamStatistic table
    const statsRecord = await this.prisma.teamStatistic.findFirst({
      where: {
        team: { externalId: teamExternalId },
        league: { externalId: leagueExternalId },
        season,
      },
    });

    if (statsRecord) {
      return {
        fixtures: {
          played: { total: statsRecord.playedTotal },
          wins: { total: statsRecord.winsTotal },
          draws: { total: statsRecord.drawsTotal },
          loses: { total: statsRecord.losesTotal },
        },
        goals: {
          for: { 
            total: { total: statsRecord.goalsForTotal },
            average: { total: statsRecord.goalsForAverage.toFixed(2) }
          },
          against: { 
            total: { total: statsRecord.goalsAgainstTotal },
            average: { total: statsRecord.goalsAgainstAvg.toFixed(2) }
          },
        },
        clean_sheet: { total: statsRecord.cleanSheets },
        failed_to_score: { total: statsRecord.failedToScore },
        average_possession: statsRecord.avgPossession,
        average_shots: statsRecord.avgShots,
      };
    }

    // 2. Fallback to Standing table if detailed stats are not yet calculated
    const standing = await this.prisma.standing.findFirst({
      where: {
        team: { externalId: teamExternalId },
        league: { externalId: leagueExternalId },
        season,
      },
    });

    if (!standing) {
      return null;
    }

    return {
      fixtures: {
        played: { total: standing.played },
        wins: { total: standing.win },
        draws: { total: standing.draw },
        loses: { total: standing.lose },
      },
      goals: {
        for: { 
          total: { total: standing.goalsFor },
          average: { total: (standing.goalsFor / standing.played || 0).toFixed(2) }
        },
        against: { 
          total: { total: standing.goalsAgainst },
          average: { total: (standing.goalsAgainst / standing.played || 0).toFixed(2) }
        },
      },
      clean_sheet: { total: 0 },
      failed_to_score: { total: 0 },
    };
  }
}
