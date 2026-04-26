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
}
