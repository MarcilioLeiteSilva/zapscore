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
    
    // Bypass cache for LIVE matches to ensure real-time data
    const isLiveRequest = status?.trim().toUpperCase() === 'LIVE';
    const cacheKey = isLiveRequest ? null : this.redis.generateKey('fixtures:list', params);
    
    if (cacheKey) {
      const cached = await this.redis.getJson(cacheKey);
      if (cached) return cached;
    }

    const where: any = {};
    if (leagueId) where.league = { externalId: leagueId };
    if (season) where.season = season;
    if (teamId) where.OR = [{ homeTeam: { externalId: teamId } }, { awayTeam: { externalId: teamId } }];
    if (date) {
      // Ajusta para o fuso horário de Brasília (UTC-3)
      // 00:00 local = 03:00 UTC
      // 23:59:59.999 local = 02:59:59.999 UTC do dia seguinte
      const start = new Date(`${date}T03:00:00.000Z`);
      const end = new Date(`${date}T02:59:59.999Z`);
      end.setDate(end.getDate() + 1);
      where.date = { gte: start, lte: end };
    }
    if (status) {
      const LIVE_STATUSES = ['1H', '2H', 'HT', 'ET', 'P', 'BT', 'LIVE'];
      if (isLiveRequest) {
        where.statusShort = { in: LIVE_STATUSES };
      } else {
        where.statusShort = status;
      }
    }

    const data = await this.prisma.fixture.findMany({
      where,
      include: { league: true, homeTeam: true, awayTeam: true },
      orderBy: { date: 'asc' },
      take: limit,
      skip: (page - 1) * limit,
    });

    // Cache the result if not a live request
    if (cacheKey) {
      await this.redis.setJson(cacheKey, data, 300);
    }
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
    // Obtém a data de hoje no fuso horário de Brasília (America/Sao_Paulo) no formato YYYY-MM-DD
    const date = new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' });
    return this.findMany({ date, leagueId });
  }

  async getAiPerformanceStats(params: { leagueId?: number; days?: number }) {
    const { leagueId, days } = params;

    const where: any = {
      isHit: { not: null },
    };

    if (leagueId) {
      where.fixture = where.fixture || {};
      where.fixture.league = { externalId: leagueId };
    }

    if (days) {
      const cutOffDate = new Date();
      cutOffDate.setDate(cutOffDate.getDate() - days);
      where.fixture = where.fixture || {};
      where.fixture.date = { gte: cutOffDate };
    }

    // Busca contagens totais, acertos e erros
    const [totalGames, hits] = await Promise.all([
      this.prisma.fixtureAiAnalysis.count({ where }),
      this.prisma.fixtureAiAnalysis.count({
        where: {
          ...where,
          isHit: true,
        },
      }),
    ]);

    const misses = totalGames - hits;
    const accuracyPercentage = totalGames > 0 ? parseFloat(((hits / totalGames) * 100).toFixed(1)) : 0;

    // Busca os últimos 50 jogos auditados
    const recentResolved = await this.prisma.fixtureAiAnalysis.findMany({
      where,
      include: {
        fixture: {
          include: {
            homeTeam: true,
            awayTeam: true,
            league: true,
          },
        },
      },
      orderBy: {
        fixture: {
          date: 'desc',
        },
      },
      take: 50,
    });

    const recentAudits = recentResolved.map(analysis => {
      const fix = analysis.fixture;
      return {
        fixtureId: fix.id,
        homeTeam: fix.homeTeam.name,
        homeTeamLogo: fix.homeTeam.logo,
        awayTeam: fix.awayTeam.name,
        awayTeamLogo: fix.awayTeam.logo,
        score: `${fix.homeGoals ?? 0}-${fix.awayGoals ?? 0}`,
        predicted: analysis.predictedResult,
        isHit: analysis.isHit,
        date: fix.date,
        leagueName: fix.league.name,
      };
    });

    return {
      totalGames,
      hits,
      misses,
      accuracyPercentage,
      recentAudits,
    };
  }
}
