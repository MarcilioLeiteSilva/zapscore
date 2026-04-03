import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class FixturesService {
  private readonly logger = new Logger(FixturesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async findMany(params: {
    leagueId?: number;
    season?: number;
    teamId?: number;
    date?: string;
    round?: string;
    status?: string;
    limit?: number;
    page?: number;
  }) {
    const { leagueId, season, teamId, date, round, status, limit = 50, page = 1 } = params;
    
    // Cache Key
    const cacheKey = this.redis.generateKey('fixtures:list', params);
    const cached = await this.redis.getJson(cacheKey);
    if (cached) return cached;

    const where: any = {};
    if (leagueId) where.league = { externalId: leagueId };
    if (season) where.season = season;
    if (teamId) where.OR = [{ homeTeam: { externalId: teamId } }, { awayTeam: { externalId: teamId } }];
    if (date) {
      const start = new Date(date); start.setHours(0, 0, 0, 0);
      const end = new Date(date); end.setHours(23, 59, 59, 999);
      where.date = { gte: start, lte: end };
    }
    if (status) where.statusShort = status;

    const data = await this.prisma.fixture.findMany({
      where,
      include: { league: true, homeTeam: true, awayTeam: true },
      orderBy: { date: 'asc' },
      take: limit,
      skip: (page - 1) * limit,
    });

    // Cache the result for 5 minutes (fixtures can change often but not constantly)
    await this.redis.setJson(cacheKey, data, 300);
    return data;
  }

  async findById(id: string) {
    const cacheKey = `fixture:detail:${id}`;
    const cached = await this.redis.getJson<any>(cacheKey);
    if (cached) return cached;

    const fixture = await this.prisma.fixture.findUnique({
      where: { id },
      include: {
        homeTeam: true,
        awayTeam: true,
        league: true,
        events: true,
        stats: true,
        lineups: true,
      },
    });

    if (fixture) {
      await this.redis.setJson(cacheKey, fixture, 300); // 5 min cache
    }

    return fixture;
  }

  async findEvents(fixtureId: string) {
    return this.prisma.fixtureEvent.findMany({
      where: { fixtureId },
      orderBy: { time: 'asc' },
    });
  }

  async findStats(fixtureId: string) {
    return this.prisma.fixtureStat.findMany({
      where: { fixtureId },
    });
  }

  async findLineups(fixtureId: string) {
    return this.prisma.fixtureLineup.findMany({
      where: { fixtureId },
      orderBy: { isStart: 'desc' },
    });
  }

  async findToday(leagueId?: number) {
    const date = new Date().toISOString().split('T')[0];
    return this.findMany({ date, leagueId });
  }
}
