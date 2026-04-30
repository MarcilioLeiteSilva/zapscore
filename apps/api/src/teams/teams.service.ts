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

  async getTeamStats(teamExternalId: number, leagueExternalId: number, season: number) {
    // 0. Find internal records first to ensure we have valid IDs
    const league = await this.prisma.league.findUnique({
      where: { externalId: leagueExternalId },
      select: { id: true }
    });
    const team = await this.prisma.team.findUnique({
      where: { externalId: teamExternalId },
      select: { id: true }
    });

    if (!league || !team) {
      return null;
    }

    // 1. Try to get detailed statistics
    const statsRecord = await this.prisma.teamStatistic.findFirst({
      where: {
        teamId: team.id,
        leagueId: league.id,
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
            average: { total: statsRecord.goalsForAverage?.toString() || '0' },
          },
          against: {
            total: { total: statsRecord.goalsAgainstTotal },
            average: { total: statsRecord.goalsAgainstAvg?.toString() || '0' },
          },
        },
        clean_sheet: { total: statsRecord.cleanSheets },
        failed_to_score: { total: statsRecord.failedToScore },
        average_possession: statsRecord.avgPossession?.toFixed(0) || null,
        average_shots: statsRecord.avgShots?.toFixed(1) || null,
      };
    }

    // 2. Aggregate manually from match history (fixtures)
    // We skip the Standing table because it often lacks detailed goal data
    const fixtures = await this.prisma.fixture.findMany({
      where: {
        leagueId: league.id,
        season,
        OR: [
          { homeTeamId: team.id },
          { awayTeamId: team.id },
        ],
        statusShort: 'FT',
      },
      include: {
        stats: true,
      },
    });

    if (fixtures.length === 0) {
      return null;
    }

    let played = 0;
    let wins = 0;
    let draws = 0;
    let losses = 0;
    let goalsFor = 0;
    let goalsAgainst = 0;
    let cleanSheets = 0;
    let failedToScore = 0;
    
    let totalPossession = 0;
    let possessionCount = 0;
    let totalShots = 0;
    let shotsCount = 0;

    for (const f of fixtures) {
      played++;
      const isHome = f.homeTeamId === team.id;
      const teamGoals = isHome ? (f.homeGoals ?? 0) : (f.awayGoals ?? 0);
      const opponentGoals = isHome ? (f.awayGoals ?? 0) : (f.homeGoals ?? 0);

      goalsFor += teamGoals;
      goalsAgainst += opponentGoals;

      if (teamGoals > opponentGoals) wins++;
      else if (teamGoals < opponentGoals) losses++;
      else draws++;

      if (opponentGoals === 0) cleanSheets++;
      if (teamGoals === 0) failedToScore++;

      const teamStats = f.stats.filter(s => s.teamId === teamExternalId);
      for (const s of teamStats) {
        if (s.type === 'Ball Possession' && s.value) {
          const val = parseInt(s.value.replace('%', ''));
          if (!isNaN(val)) {
            totalPossession += val;
            possessionCount++;
          }
        }
        if (s.type === 'Total Shots' && s.value) {
          const val = parseInt(s.value);
          if (!isNaN(val)) {
            totalShots += val;
            shotsCount++;
          }
        }
      }
    }

    return {
      fixtures: {
        played: { total: played },
        wins: { total: wins },
        draws: { total: draws },
        loses: { total: losses },
      },
      goals: {
        for: { 
          total: { total: goalsFor },
          average: { total: (goalsFor / played).toFixed(2) }
        },
        against: { 
          total: { total: goalsAgainst },
          average: { total: (goalsAgainst / played).toFixed(2) }
        },
      },
      clean_sheet: { total: cleanSheets },
      failed_to_score: { total: failedToScore },
      average_possession: possessionCount > 0 ? (totalPossession / possessionCount).toFixed(0) : null,
      average_shots: shotsCount > 0 ? (totalShots / shotsCount).toFixed(1) : null,
    };
  }
}
