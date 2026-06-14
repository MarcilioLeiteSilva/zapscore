import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AiService } from './ai.service';

@Injectable()
export class AiSyncService {
  private readonly logger = new Logger(AiSyncService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService,
  ) {}

  async syncFixtureAnalysis(fixtureId: string, forceUpdate: boolean = false): Promise<any> {
    this.logger.log(`Starting AI prediction sync for fixture ${fixtureId}`);

    // 1. Carregar os dados básicos da partida
    const fixture = await this.prisma.fixture.findUnique({
      where: { id: fixtureId },
      include: {
        homeTeam: true,
        awayTeam: true,
        league: true,
        lineups: true,
        stats: true,
      },
    });

    if (!fixture) {
      throw new Error(`Fixture ${fixtureId} not found in database.`);
    }

    // 2. Verificar se já existe análise e se já considerou escalações
    const existingAnalysis = await this.prisma.fixtureAiAnalysis.findUnique({
      where: { fixtureId: fixture.id },
    });

    const hasLineupsInDb = fixture.lineups && fixture.lineups.length > 0;
    const shouldFactorLineups = hasLineupsInDb && ['NS', '1H', 'HT', '2H', 'LIVE'].includes(fixture.statusShort || '');

    if (existingAnalysis && !forceUpdate) {
      // Se já foi gerado considerando escalações, ou se não temos novas escalações para considerar
      if (existingAnalysis.lineupsFactored || !shouldFactorLineups) {
        this.logger.log(`AI prediction for fixture ${fixtureId} is already up-to-date. Skipping.`);
        return existingAnalysis;
      }
    }

    // 3. Carregar classificação das equipes (Standings)
    const [homeStanding, awayStanding] = await Promise.all([
      this.prisma.standing.findUnique({
        where: {
          leagueId_teamId_season: {
            leagueId: fixture.leagueId,
            teamId: fixture.homeTeamId,
            season: fixture.season,
          },
        },
      }),
      this.prisma.standing.findUnique({
        where: {
          leagueId_teamId_season: {
            leagueId: fixture.leagueId,
            teamId: fixture.awayTeamId,
            season: fixture.season,
          },
        },
      }),
    ]);

    // 4. Carregar estatísticas acumuladas dos times (TeamStatistics)
    const [homeStats, awayStats] = await Promise.all([
      this.prisma.teamStatistic.findUnique({
        where: {
          teamId_leagueId_season: {
            teamId: fixture.homeTeamId,
            leagueId: fixture.leagueId,
            season: fixture.season,
          },
        },
      }),
      this.prisma.teamStatistic.findUnique({
        where: {
          teamId_leagueId_season: {
            leagueId: fixture.leagueId,
            teamId: fixture.awayTeamId,
            season: fixture.season,
          },
        },
      }),
    ]);

    // 5. Carregar últimos confrontos de cada time (Forma recente)
    const [lastHomeMatches, lastAwayMatches, h2hMatches] = await Promise.all([
      this.prisma.fixture.findMany({
        where: {
          OR: [
            { homeTeamId: fixture.homeTeamId },
            { awayTeamId: fixture.homeTeamId },
          ],
          statusShort: 'FT',
        },
        orderBy: { date: 'desc' },
        take: 5,
        include: { homeTeam: true, awayTeam: true },
      }),
      this.prisma.fixture.findMany({
        where: {
          OR: [
            { homeTeamId: fixture.awayTeamId },
            { awayTeamId: fixture.awayTeamId },
          ],
          statusShort: 'FT',
        },
        orderBy: { date: 'desc' },
        take: 5,
        include: { homeTeam: true, awayTeam: true },
      }),
      this.prisma.fixture.findMany({
        where: {
          OR: [
            { homeTeamId: fixture.homeTeamId, awayTeamId: fixture.awayTeamId },
            { homeTeamId: fixture.awayTeamId, awayTeamId: fixture.homeTeamId },
          ],
          statusShort: 'FT',
        },
        orderBy: { date: 'desc' },
        take: 5,
        include: { homeTeam: true, awayTeam: true },
      }),
    ]);

    // 6. Formatar o pacote de dados para o prompt da IA
    const matchData = {
      competition: fixture.league.name,
      round: fixture.round,
      date: fixture.date,
      venue: fixture.venueName ? `${fixture.venueName}, ${fixture.venueCity}` : 'Indefinido',
      teams: {
        home: {
          name: fixture.homeTeam.name,
          standingRank: homeStanding?.rank || 'N/A',
          standingPoints: homeStanding?.points || 0,
          formRecent: lastHomeMatches.map(m => {
            const isHome = m.homeTeamId === fixture.homeTeamId;
            const myGoals = (isHome ? m.homeGoals : m.awayGoals) ?? 0;
            const oppGoals = (isHome ? m.awayGoals : m.homeGoals) ?? 0;
            const oppName = isHome ? m.awayTeam.name : m.homeTeam.name;
            const result = myGoals > oppGoals ? 'V' : myGoals < oppGoals ? 'D' : 'E';
            return `${result} (${myGoals}-${oppGoals} vs ${oppName})`;
          }),
          stats: homeStats ? {
            played: homeStats.playedTotal,
            wins: homeStats.winsTotal,
            draws: homeStats.drawsTotal,
            losses: homeStats.losesTotal,
            goalsScoredAvg: homeStats.goalsForAverage,
            goalsConcededAvg: homeStats.goalsAgainstAvg,
            cleanSheets: homeStats.cleanSheets,
            failedToScore: homeStats.failedToScore,
          } : null,
        },
        away: {
          name: fixture.awayTeam.name,
          standingRank: awayStanding?.rank || 'N/A',
          standingPoints: awayStanding?.points || 0,
          formRecent: lastAwayMatches.map(m => {
            const isHome = m.homeTeamId === fixture.awayTeamId;
            const myGoals = (isHome ? m.homeGoals : m.awayGoals) ?? 0;
            const oppGoals = (isHome ? m.awayGoals : m.homeGoals) ?? 0;
            const oppName = isHome ? m.awayTeam.name : m.homeTeam.name;
            const result = myGoals > oppGoals ? 'V' : myGoals < oppGoals ? 'D' : 'E';
            return `${result} (${myGoals}-${oppGoals} vs ${oppName})`;
          }),
          stats: awayStats ? {
            played: awayStats.playedTotal,
            wins: awayStats.winsTotal,
            draws: awayStats.drawsTotal,
            losses: awayStats.losesTotal,
            goalsScoredAvg: awayStats.goalsForAverage,
            goalsConcededAvg: awayStats.goalsAgainstAvg,
            cleanSheets: awayStats.cleanSheets,
            failedToScore: awayStats.failedToScore,
          } : null,
        },
      },
      headToHead: h2hMatches.map(m => ({
        date: m.date,
        homeTeam: m.homeTeam.name,
        awayTeam: m.awayTeam.name,
        score: `${m.homeGoals ?? 0}-${m.awayGoals ?? 0}`,
      })),
      lineups: shouldFactorLineups ? {
        homeStartingXI: fixture.lineups
          .filter(l => l.teamId === fixture.homeTeam.externalId && l.isStart)
          .map(l => `${l.player} (${l.pos || 'N/A'})`),
        awayStartingXI: fixture.lineups
          .filter(l => l.teamId === fixture.awayTeam.externalId && l.isStart)
          .map(l => `${l.player} (${l.pos || 'N/A'})`),
      } : null,
    };

    // 7. Chamar o serviço da IA para gerar a análise
    const analysis = await this.aiService.generateMatchAnalysis(matchData, shouldFactorLineups);

    // 8. Salvar ou atualizar no banco de dados
    const result = await this.prisma.fixtureAiAnalysis.upsert({
      where: { fixtureId: fixture.id },
      update: {
        probHome: analysis.probHome,
        probAway: analysis.probAway,
        probDraw: analysis.probDraw,
        predictionSummary: analysis.predictionSummary,
        tips: analysis.tips,
        commentary: analysis.commentary,
        lineupsFactored: shouldFactorLineups,
      },
      create: {
        fixtureId: fixture.id,
        probHome: analysis.probHome,
        probAway: analysis.probAway,
        probDraw: analysis.probDraw,
        predictionSummary: analysis.predictionSummary,
        tips: analysis.tips,
        commentary: analysis.commentary,
        lineupsFactored: shouldFactorLineups,
      },
    });

    this.logger.log(`AI prediction successfully generated and saved for fixture ${fixtureId}. Lineups factored: ${shouldFactorLineups}`);
    return result;
  }
}
