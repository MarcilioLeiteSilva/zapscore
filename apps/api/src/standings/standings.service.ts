import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StandingsService {
  constructor(private readonly prisma: PrismaService) {}

  async findByLeagueAndSeason(leagueId: string, season: number) {
    return this.prisma.standing.findMany({
      where: {
        leagueId,
        season,
      },
      include: {
        team: true,
      },
      orderBy: { rank: 'asc' },
    });
  }

  async findByLeagueExternalIdAndSeason(leagueExternalId: number, season: number) {
    const league = await this.prisma.league.findUnique({
      where: { externalId: leagueExternalId },
    });

    if (!league) return [];

    return this.findByLeagueAndSeason(league.id, season);
  }
}
