import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class StandingsService {
  private readonly logger = new Logger(StandingsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async findByLeagueAndSeason(leagueId: string, season: number) {
    const cacheKey = `standings:dbId:${leagueId}:${season}`;
    const cached = await this.redis.getJson(cacheKey);
    if (cached) return cached;

    const data = await this.prisma.standing.findMany({
      where: { leagueId, season },
      include: { team: true },
      orderBy: { rank: 'asc' },
    });

    if (data.length > 0) await this.redis.setJson(cacheKey, data, 1800); // 30 min cache
    return data;
  }

  async findMany(params: {
    leagueId?: number;
    season?: number;
  }) {
    const { leagueId, season = 2026 } = params;
    
    const cacheKey = this.redis.generateKey('standings:list', params);
    const cached = await this.redis.getJson(cacheKey);
    if (cached) return cached;

    if (leagueId) {
      const league = await this.prisma.league.findUnique({
        where: { externalId: leagueId },
      });
      if (!league) return [];
      
      const data = await this.findByLeagueAndSeason(league.id, season);
      await this.redis.setJson(cacheKey, data, 1800);
      return data;
    }

    const data = await this.prisma.standing.findMany({
       where: { season },
       include: { team: true, league: true },
       orderBy: { rank: 'asc' }
    });

    if (data.length > 0) await this.redis.setJson(cacheKey, data, 1800);
    return data;
  }
}
