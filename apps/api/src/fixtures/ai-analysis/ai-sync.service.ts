import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AiService } from './ai.service';
import { ApiFootballService } from '../../integrations/api-football/api-football.service';

@Injectable()
export class AiSyncService {
  private readonly logger = new Logger(AiSyncService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService,
    private readonly apiFootball: ApiFootballService,
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

    // 4. Carregar/Sincronizar estatísticas acumuladas dos times (TeamStatistics) com a API-Football
    const [homeStats, awayStats] = await Promise.all([
      this.getOrSyncTeamStats(
        fixture.homeTeamId,
        fixture.homeTeam.externalId,
        fixture.leagueId,
        fixture.league.externalId,
        fixture.season,
      ),
      this.getOrSyncTeamStats(
        fixture.awayTeamId,
        fixture.awayTeam.externalId,
        fixture.leagueId,
        fixture.league.externalId,
        fixture.season,
      ),
    ]);

    // 5. Carregar últimos confrontos de cada time (Forma recente)
    const [lastHomeMatches, lastAwayMatches] = await Promise.all([
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
    ]);

    // Buscar confrontos diretos reais da API-Football (com fallback resiliente ao banco local)
    let h2hMatches: any[] = [];
    try {
      if (fixture.homeTeam?.externalId && fixture.awayTeam?.externalId) {
        const rawH2H = await this.apiFootball.getHeadToHead(
          fixture.homeTeam.externalId,
          fixture.awayTeam.externalId,
        );
        h2hMatches = (rawH2H || [])
          .filter((m: any) => m.fixture.status.short === 'FT')
          .slice(0, 5);
      }
    } catch (err) {
      this.logger.error(`Error fetching real H2H for AI Sync: ${err.message}`);
    }

    // Fallback local se a API externa falhar ou retornar vazia
    if (h2hMatches.length === 0) {
      h2hMatches = await this.prisma.fixture.findMany({
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
      });
    }

    // Padronizar o mapeamento dos confrontos diretos
    const formattedH2H = h2hMatches.map((m) => {
      // Se vier do banco local (Prisma)
      if (m.homeTeam) {
        return {
          date: m.date,
          homeTeam: m.homeTeam.name,
          awayTeam: m.awayTeam.name,
          score: `${m.homeGoals ?? 0}-${m.awayGoals ?? 0}`,
        };
      }
      // Se vier da API-Football
      return {
        date: new Date(m.fixture.date),
        homeTeam: m.teams.home.name,
        awayTeam: m.teams.away.name,
        score: `${m.goals.home ?? 0}-${m.goals.away ?? 0}`,
      };
    });

    // 6. Buscar Odds de mercado da API-Football
    let odds: any = null;
    try {
      if (fixture.externalId) {
        const rawOdds = await this.apiFootball.getOdds(fixture.externalId);
        if (rawOdds && rawOdds.length > 0) {
          const bookmakers = rawOdds[0].bookmakers;
          const bookmaker = bookmakers?.find((b: any) => b.id === 1) || bookmakers?.[0];
          const bet = bookmaker?.bets?.find((b: any) => b.id === 1); // 1 = Match Winner (1X2)
          if (bet && bet.values) {
            const hOdd = bet.values.find((v: any) => v.value === 'Home')?.odd;
            const dOdd = bet.values.find((v: any) => v.value === 'Draw')?.odd;
            const aOdd = bet.values.find((v: any) => v.value === 'Away')?.odd;
            if (hOdd && dOdd && aOdd) {
              odds = {
                home: parseFloat(hOdd),
                draw: parseFloat(dOdd),
                away: parseFloat(aOdd),
              };
              
              // Salvar no banco local
              await this.prisma.fixture.update({
                where: { id: fixture.id },
                data: {
                  oddsHome: odds.home,
                  oddsDraw: odds.draw,
                  oddsAway: odds.away,
                },
              });
            }
          }
        }
      }
    } catch (err) {
      this.logger.error(`Error fetching real odds for AI Sync: ${err.message}`);
    }

    if (!odds && fixture.oddsHome !== null && fixture.oddsDraw !== null && fixture.oddsAway !== null) {
      odds = {
        home: fixture.oddsHome,
        draw: fixture.oddsDraw,
        away: fixture.oddsAway,
      };
    }

    // 7. Buscar lesões/suspensões confirmadas da API-Football
    let absences: any[] = [];
    try {
      if (fixture.externalId) {
        const rawInjuries = await this.apiFootball.getInjuries(fixture.externalId);
        if (rawInjuries && rawInjuries.length > 0) {
          absences = rawInjuries.map((inj: any) => ({
            teamId: inj.team.id,
            teamName: inj.team.name,
            player: inj.player.name,
            type: inj.player.type || 'Missing',
            reason: inj.player.reason || 'N/A',
          }));
        }
      }
    } catch (err) {
      this.logger.error(`Error fetching real injuries for AI Sync: ${err.message}`);
    }

    const homeAbsences = absences
      .filter((a) => a.teamId === fixture.homeTeam.externalId)
      .map((a) => `${a.player} (${a.type}: ${a.reason})`);

    const awayAbsences = absences
      .filter((a) => a.teamId === fixture.awayTeam.externalId)
      .map((a) => `${a.player} (${a.type}: ${a.reason})`);

    // 8. Formatar o pacote de dados para o prompt da IA
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
            playedTotal: homeStats.playedTotal,
            winsTotal: homeStats.winsTotal,
            drawsTotal: homeStats.drawsTotal,
            lossesTotal: homeStats.losesTotal,
            goalsScoredAvg: homeStats.goalsForAverage,
            goalsConcededAvg: homeStats.goalsAgainstAvg,
            cleanSheets: homeStats.cleanSheets,
            failedToScore: homeStats.failedToScore,
            avgPossession: homeStats.avgPossession,
            avgShots: homeStats.avgShots,
            avgShotsOnTarget: homeStats.avgShotsOnTarget,
            // Splits de mandante
            playedHome: homeStats.playedHome,
            winsHome: homeStats.winsHome,
            drawsHome: homeStats.drawsHome,
            lossesHome: homeStats.lossesHome,
            goalsScoredHome: homeStats.goalsForHome,
            goalsConcededHome: homeStats.goalsAgainstHome,
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
            playedTotal: awayStats.playedTotal,
            winsTotal: awayStats.winsTotal,
            drawsTotal: awayStats.drawsTotal,
            lossesTotal: awayStats.losesTotal,
            goalsScoredAvg: awayStats.goalsForAverage,
            goalsConcededAvg: awayStats.goalsAgainstAvg,
            cleanSheets: awayStats.cleanSheets,
            failedToScore: awayStats.failedToScore,
            avgPossession: awayStats.avgPossession,
            avgShots: awayStats.avgShots,
            avgShotsOnTarget: awayStats.avgShotsOnTarget,
            // Splits de visitante
            playedAway: awayStats.playedAway,
            winsAway: awayStats.winsAway,
            drawsAway: awayStats.drawsAway,
            lossesAway: awayStats.lossesAway,
            goalsScoredAway: awayStats.goalsForAway,
            goalsConcededAway: awayStats.goalsAgainstAway,
          } : null,
        },
      },
      headToHead: formattedH2H,
      marketOdds: odds,
      absences: {
        home: homeAbsences,
        away: awayAbsences,
      },
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

    // Calcular predictedResult baseado na maior probabilidade
    let predictedResult: string = 'DRAW';
    if (analysis.probHome > analysis.probAway && analysis.probHome > analysis.probDraw) {
      predictedResult = 'HOME';
    } else if (analysis.probAway > analysis.probHome && analysis.probAway > analysis.probDraw) {
      predictedResult = 'AWAY';
    }

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
        predictedResult,
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
        predictedResult,
      },
    });

    this.logger.log(`AI prediction successfully generated and saved for fixture ${fixtureId}. Lineups factored: ${shouldFactorLineups}`);
    return result;
  }

  async resolveFixtureAnalysis(fixtureId: string): Promise<any> {
    this.logger.log(`Resolving AI prediction for fixture ${fixtureId}`);
    
    // 1. Carrega a análise e os dados da partida (placar)
    const analysis = await this.prisma.fixtureAiAnalysis.findUnique({
      where: { fixtureId },
      include: { fixture: true },
    });

    if (!analysis) {
      this.logger.log(`No AI analysis found for fixture ${fixtureId}. Skipping resolution.`);
      return null;
    }

    const fixture = analysis.fixture;
    
    // Só resolve se o jogo estiver finalizado (FT, AET, PEN)
    const FINISHED_STATUSES = ['FT', 'AET', 'PEN'];
    if (!FINISHED_STATUSES.includes(fixture.statusShort || '')) {
      this.logger.log(`Fixture ${fixtureId} is not finished (status: ${fixture.statusShort}). Cannot resolve.`);
      return analysis;
    }

    const homeGoals = fixture.homeGoals ?? 0;
    const awayGoals = fixture.awayGoals ?? 0;

    // 2. Determinar o resultado real da partida
    let actualResult: 'HOME' | 'AWAY' | 'DRAW' = 'DRAW';
    if (homeGoals > awayGoals) {
      actualResult = 'HOME';
    } else if (awayGoals > homeGoals) {
      actualResult = 'AWAY';
    }

    // 3. Determinar o resultado previsto originalmente (se não estiver salvo ainda)
    let predictedResult = analysis.predictedResult;
    if (!predictedResult) {
      if (analysis.probHome > analysis.probAway && analysis.probHome > analysis.probDraw) {
        predictedResult = 'HOME';
      } else if (analysis.probAway > analysis.probHome && analysis.probAway > analysis.probDraw) {
        predictedResult = 'AWAY';
      } else {
        predictedResult = 'DRAW';
      }
    }

    const isHit = predictedResult === actualResult;

    // 4. Avaliar cada dica (tips) textualmente contra o resultado real
    const tipsStatus = Array.isArray(analysis.tips) 
      ? analysis.tips.map((tip: string) => {
          const hit = this.evaluateTip(tip, homeGoals, awayGoals);
          return { tip, hit };
        })
      : [];

    // 5. Atualizar no banco de dados
    const updated = await this.prisma.fixtureAiAnalysis.update({
      where: { fixtureId },
      data: {
        predictedResult,
        isHit,
        tipsStatus,
      },
    });

    this.logger.log(`AI prediction for fixture ${fixtureId} resolved: isHit = ${isHit}`);
    return updated;
  }

  private evaluateTip(tipText: string, homeGoals: number, awayGoals: number): boolean {
    const normalized = tipText.toLowerCase().trim();
    const totalGoals = homeGoals + awayGoals;

    // Regras de gols
    if (normalized.includes('mais de 2.5') || normalized.includes('over 2.5') || normalized.includes('+2.5')) {
      return totalGoals > 2;
    }
    if (normalized.includes('mais de 1.5') || normalized.includes('over 1.5') || normalized.includes('+1.5')) {
      return totalGoals > 1;
    }
    if (normalized.includes('mais de 3.5') || normalized.includes('over 3.5') || normalized.includes('+3.5')) {
      return totalGoals > 3;
    }
    if (normalized.includes('menos de 2.5') || normalized.includes('under 2.5') || normalized.includes('-2.5')) {
      return totalGoals < 3;
    }
    if (normalized.includes('menos de 3.5') || normalized.includes('under 3.5') || normalized.includes('-3.5')) {
      return totalGoals < 4;
    }

    // Regras de Ambas Marcam
    if (normalized.includes('ambas marcam') || normalized.includes('ambas marcarem') || normalized.includes('btts')) {
      if (normalized.includes('não') || normalized.includes('nao')) {
        return homeGoals === 0 || awayGoals === 0;
      }
      return homeGoals > 0 && awayGoals > 0;
    }

    // Regras de vencedor
    if (normalized.includes('vence') || normalized.includes('vitória') || normalized.includes('vitoria') || normalized.includes('vencedor')) {
      if (normalized.includes('casa') || normalized.includes('mandante')) {
        return homeGoals > awayGoals;
      }
      if (normalized.includes('fora') || normalized.includes('visitante')) {
        return awayGoals > homeGoals;
      }
    }

    if (normalized.includes('empate')) {
      return homeGoals === awayGoals;
    }

    // Gols individuais de time
    if (normalized.includes('marcam') || normalized.includes('marca') || normalized.includes('gol')) {
      if (normalized.includes('casa') || normalized.includes('mandante')) {
        return homeGoals > 0;
      }
      if (normalized.includes('fora') || normalized.includes('visitante')) {
        return awayGoals > 0;
      }
    }

    // Fallback padrão se não for mapeado por regras acima
    return true; 
  }

  private async getOrSyncTeamStats(
    teamId: string,
    teamExternalId: number,
    leagueId: string,
    leagueExternalId: number,
    season: number,
  ) {
    let stats = await this.prisma.teamStatistic.findUnique({
      where: {
        teamId_leagueId_season: {
          teamId,
          leagueId,
          season,
        },
      },
    });

    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    if (!stats || stats.updatedAt < oneDayAgo) {
      try {
        const rawStats = await this.apiFootball.get('/teams/statistics', {
          team: teamExternalId,
          league: leagueExternalId,
          season,
        });

        if (rawStats) {
          stats = await this.prisma.teamStatistic.upsert({
            where: {
              teamId_leagueId_season: {
                teamId,
                leagueId,
                season,
              },
            },
            update: {
              playedTotal: rawStats.fixtures.played.total ?? 0,
              winsTotal: rawStats.fixtures.wins.total ?? 0,
              drawsTotal: rawStats.fixtures.draws.total ?? 0,
              losesTotal: rawStats.fixtures.loses.total ?? 0,

              playedHome: rawStats.fixtures.played.home ?? 0,
              winsHome: rawStats.fixtures.wins.home ?? 0,
              drawsHome: rawStats.fixtures.draws.home ?? 0,
              lossesHome: rawStats.fixtures.loses.home ?? 0,

              playedAway: rawStats.fixtures.played.away ?? 0,
              winsAway: rawStats.fixtures.wins.away ?? 0,
              drawsAway: rawStats.fixtures.draws.away ?? 0,
              lossesAway: rawStats.fixtures.loses.away ?? 0,

              goalsForTotal: rawStats.goals.for.total.total ?? 0,
              goalsAgainstTotal: rawStats.goals.against.total.total ?? 0,
              goalsForAverage: parseFloat(rawStats.goals.for.average.total) || 0,
              goalsAgainstAvg: parseFloat(rawStats.goals.against.average.total) || 0,

              goalsForHome: rawStats.goals.for.total.home ?? 0,
              goalsAgainstHome: rawStats.goals.against.total.home ?? 0,
              goalsForAway: rawStats.goals.for.total.away ?? 0,
              goalsAgainstAway: rawStats.goals.against.total.away ?? 0,

              cleanSheets: rawStats.clean_sheet.total ?? 0,
              failedToScore: rawStats.failed_to_score.total ?? 0,
              avgPossession: rawStats.avgPossession ? parseFloat(rawStats.avgPossession) : null,
              avgShots: rawStats.avgShots ? parseFloat(rawStats.avgShots) : null,
            },
            create: {
              teamId,
              leagueId,
              season,
              playedTotal: rawStats.fixtures.played.total ?? 0,
              winsTotal: rawStats.fixtures.wins.total ?? 0,
              drawsTotal: rawStats.fixtures.draws.total ?? 0,
              losesTotal: rawStats.fixtures.loses.total ?? 0,

              playedHome: rawStats.fixtures.played.home ?? 0,
              winsHome: rawStats.fixtures.wins.home ?? 0,
              drawsHome: rawStats.fixtures.draws.home ?? 0,
              lossesHome: rawStats.fixtures.loses.home ?? 0,

              playedAway: rawStats.fixtures.played.away ?? 0,
              winsAway: rawStats.fixtures.wins.away ?? 0,
              drawsAway: rawStats.fixtures.draws.away ?? 0,
              lossesAway: rawStats.fixtures.loses.away ?? 0,

              goalsForTotal: rawStats.goals.for.total.total ?? 0,
              goalsAgainstTotal: rawStats.goals.against.total.total ?? 0,
              goalsForAverage: parseFloat(rawStats.goals.for.average.total) || 0,
              goalsAgainstAvg: parseFloat(rawStats.goals.against.average.total) || 0,

              goalsForHome: rawStats.goals.for.total.home ?? 0,
              goalsAgainstHome: rawStats.goals.against.total.home ?? 0,
              goalsForAway: rawStats.goals.for.total.away ?? 0,
              goalsAgainstAway: rawStats.goals.against.total.away ?? 0,

              cleanSheets: rawStats.clean_sheet.total ?? 0,
              failedToScore: rawStats.failed_to_score.total ?? 0,
              avgPossession: rawStats.avgPossession ? parseFloat(rawStats.avgPossession) : null,
              avgShots: rawStats.avgShots ? parseFloat(rawStats.avgShots) : null,
            },
          });
        }
      } catch (err) {
        this.logger.error(`Error syncing team statistics from API-Football: ${err.message}`);
      }
    }

    return stats;
  }
}
