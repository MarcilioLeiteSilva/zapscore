import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TeamsService {
  constructor(private readonly prisma: PrismaService) {}

  async findMany(params: {
    leagueId?: number;
    season?: number;
    search?: string;
  }) {
    const { leagueId, season, search } = params;
    
    // In our current schema, teams are not directly linked to seasons/leagues per row
    // but they appear in fixtures/standings for those.
    // To list teams of a league/season, we can query standings or fixtures.
    // For simplicity and scalability, we'll filter by name/externalId if search is provided.
    
    const where: any = {};
    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }

    if (leagueId) {
      // Find teams that were in standings for that league
      const standingTeams = await this.prisma.standing.findMany({
        where: { league: { externalId: leagueId }, season: season || 2026 },
        select: { team: true }
      });
      return standingTeams.map(s => s.team);
    }

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
