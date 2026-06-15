import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { ApiFootballService } from '../integrations/api-football/api-football.service';

@Injectable()
export class FixturesService {
  private readonly logger = new Logger(FixturesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly apiFootball: ApiFootballService,
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
    const startDate = new Date('2026-06-13T00:00:00.000Z');
    let dateFilter: any = { gte: startDate };

    if (days) {
      const cutOffDate = new Date();
      cutOffDate.setDate(cutOffDate.getDate() - days);
      const finalCutOff = cutOffDate > startDate ? cutOffDate : startDate;
      dateFilter = { gte: finalCutOff };
    }

    const where: any = {
      isHit: { not: null },
      fixture: {
        date: dateFilter,
      },
    };

    if (leagueId) {
      where.fixture.league = { externalId: leagueId };
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

  async getHeadToHead(fixtureId: string) {
    const cacheKey = `fixture:h2h:${fixtureId}`;
    const cached = await this.redis.getJson<any>(cacheKey);
    if (cached) return cached;

    // 1. Carregar a partida local para obter os IDs externos
    const fixture = await this.prisma.fixture.findUnique({
      where: { id: fixtureId },
      include: { homeTeam: true, awayTeam: true },
    });

    if (!fixture) {
      throw new Error(`Fixture ${fixtureId} not found`);
    }

    if (!fixture.homeTeam?.externalId || !fixture.awayTeam?.externalId) {
      throw new Error(`External IDs missing for teams in fixture ${fixtureId}`);
    }

    // 2. Buscar confrontos diretos na API-Football
    const rawH2H = await this.apiFootball.getHeadToHead(
      fixture.homeTeam.externalId,
      fixture.awayTeam.externalId,
    );

    // 3. Mapear os resultados passados de forma limpa e desacoplada
    const matches = (rawH2H || []).map((m: any) => ({
      id: m.fixture.id,
      date: m.fixture.date,
      venue: m.fixture.venue?.name,
      round: m.league.round,
      league: {
        name: m.league.name,
        logo: m.league.logo,
      },
      homeTeam: {
        name: m.teams.home.name,
        logo: m.teams.home.logo,
      },
      awayTeam: {
        name: m.teams.away.name,
        logo: m.teams.away.logo,
      },
      homeGoals: m.goals.home,
      awayGoals: m.goals.away,
      statusShort: m.fixture.status.short,
      statusLong: m.fixture.status.long,
    }));

    // 4. Calcular estatísticas de confrontos (Geral e Últimos 5)
    const homeTeamName = fixture.homeTeam.name;
    let homeWinsOverall = 0;
    let awayWinsOverall = 0;
    let drawsOverall = 0;

    // Ordena decrescente por data para pegar os mais recentes primeiro
    const sortedMatches = [...matches].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );

    sortedMatches.forEach((m) => {
      if (m.homeGoals === null || m.awayGoals === null) return;
      const homeGoals = m.homeGoals;
      const awayGoals = m.awayGoals;
      const isHomeWinner = homeGoals > awayGoals;
      const isAwayWinner = awayGoals > homeGoals;

      const matchHomeName = m.homeTeam.name;
      const isHomeTeamCurrentHome =
        matchHomeName.toLowerCase() === homeTeamName.toLowerCase();

      if (homeGoals === awayGoals) {
        drawsOverall++;
      } else if (
        (isHomeWinner && isHomeTeamCurrentHome) ||
        (isAwayWinner && !isHomeTeamCurrentHome)
      ) {
        homeWinsOverall++;
      } else {
        awayWinsOverall++;
      }
    });

    const last5Matches = sortedMatches.slice(0, 5);
    let homeWinsLast5 = 0;
    let awayWinsLast5 = 0;
    let drawsLast5 = 0;

    last5Matches.forEach((m) => {
      if (m.homeGoals === null || m.awayGoals === null) return;
      const homeGoals = m.homeGoals;
      const awayGoals = m.awayGoals;
      const isHomeWinner = homeGoals > awayGoals;
      const isAwayWinner = awayGoals > homeGoals;

      const matchHomeName = m.homeTeam.name;
      const isHomeTeamCurrentHome =
        matchHomeName.toLowerCase() === homeTeamName.toLowerCase();

      if (homeGoals === awayGoals) {
        drawsLast5++;
      } else if (
        (isHomeWinner && isHomeTeamCurrentHome) ||
        (isAwayWinner && !isHomeTeamCurrentHome)
      ) {
        homeWinsLast5++;
      } else {
        awayWinsLast5++;
      }
    });

    const result = {
      statistics: {
        overall: {
          homeWins: homeWinsOverall,
          awayWins: awayWinsOverall,
          draws: drawsOverall,
        },
        last5: {
          homeWins: homeWinsLast5,
          awayWins: awayWinsLast5,
          draws: drawsLast5,
        },
      },
      matches: sortedMatches,
    };

    // Cache por 1 hora (dados históricos de H2H não mudam com tanta frequência)
    await this.redis.setJson(cacheKey, result, 3600);

    return result;
  }
}
