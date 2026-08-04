import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ApiFootballService } from '../integrations/api-football/api-football.service';
import { RedisService } from '../redis/redis.service';
import { SUPPORTED_COMPETITIONS, CompetitionConfig } from '../config/competitions.config';

@Injectable()
export class CompetitionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly apiFootball: ApiFootballService,
    private readonly redis: RedisService,
  ) {}

  findAll(): CompetitionConfig[] {
    return SUPPORTED_COMPETITIONS;
  }

  findOneByExternalId(externalId: number): CompetitionConfig | undefined {
    return SUPPORTED_COMPETITIONS.find((c) => c.externalId === externalId);
  }

  async getStoredLeagues() {
    const supportedExternalIds = SUPPORTED_COMPETITIONS.map((c) => c.externalId);
    return this.prisma.league.findMany({
      where: {
        externalId: { in: supportedExternalIds },
      },
      orderBy: { name: 'asc' },
    });
  }

  async getStoredLeagueByExternalId(externalId: number) {
    return this.prisma.league.findUnique({
      where: { externalId },
    });
  }

  async getTopScorers(leagueId: number, season: number) {
    const cacheKey = `topscorers:local:${leagueId}:${season}`;
    const cached = await this.redis.getJson(cacheKey);
    if (cached) return cached;

    const league = await this.prisma.league.findUnique({
      where: { externalId: leagueId },
    });

    if (!league) return [];

    const scorers = await this.prisma.scorer.findMany({
      where: {
        leagueId: league.id,
        season,
      },
      orderBy: { rank: 'asc' },
    });

    // Cache por 1 hora
    if (scorers.length > 0) {
      await this.redis.setJson(cacheKey, scorers, 3600);
    }
    
    return scorers;
  }

  async createScorer(data: any) {
    const season = Number(data.season || 2026);

    // Resolve leagueId se for externalId numérico
    let targetLeagueUuid = data.leagueId;
    const numericExtId = parseInt(data.leagueId, 10);
    if (!isNaN(numericExtId)) {
      const league = await this.prisma.league.findUnique({ where: { externalId: numericExtId } });
      if (league) targetLeagueUuid = league.id;
    }

    const scorer = await this.prisma.scorer.create({
      data: {
        leagueId: targetLeagueUuid,
        season,
        rank: Number(data.rank || 1),
        playerName: data.playerName,
        playerPhoto: data.playerPhoto || null,
        teamName: data.teamName,
        teamLogo: data.teamLogo || null,
        goals: Number(data.goals || 0),
        assists: Number(data.assists || 0),
      },
    });
    await this.redis.delByPattern('topscorers:*');
    return scorer;
  }

  async updateScorer(id: string, data: any) {
    const updated = await this.prisma.scorer.update({
      where: { id },
      data: {
        ...(data.rank !== undefined && { rank: Number(data.rank) }),
        ...(data.playerName && { playerName: data.playerName }),
        ...(data.playerPhoto !== undefined && { playerPhoto: data.playerPhoto }),
        ...(data.teamName && { teamName: data.teamName }),
        ...(data.teamLogo !== undefined && { teamLogo: data.teamLogo }),
        ...(data.goals !== undefined && { goals: Number(data.goals) }),
      },
    });
    await this.redis.delByPattern('topscorers:*');
    return updated;
  }

  async deleteScorer(id: string) {
    const deleted = await this.prisma.scorer.delete({
      where: { id },
    });
    await this.redis.delByPattern('topscorers:*');
    return deleted;
  }
}
