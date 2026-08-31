import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { PrismaService } from '../prisma/prisma.service';

export interface BroadcastPushDto {
  leagueId?: number;
  appSlug?: string;
  title: string;
  body: string;
  imageUrl?: string;
  dataPayload?: Record<string, any>;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  private readonly PB_BRASIL = 'https://zapscore-pocketbase-brasil.gtalg3.easypanel.host';
  private readonly PB_ESTADUAIS = 'https://zapscore-pocketbase-estaduais.gtalg3.easypanel.host';
  private readonly PB_EUROPA = 'https://zapscore-pocketbase-europa.gtalg3.easypanel.host';

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Mapeia a liga / appSlug para o endpoint correto do PocketBase
   */
  private resolvePocketBaseTarget(leagueId?: number, appSlug?: string): { url: string; slug: string; name: string } {
    const slug = (appSlug || '').toLowerCase().trim();
    const id = leagueId ? Number(leagueId) : 0;

    // 1. Brasil / Brasileirão
    if (id === 71 || id === 72 || id === 73 || slug === 'brasileirao') {
      return { url: this.PB_BRASIL, slug: 'brasileirao', name: 'PocketBase Brasil' };
    }

    // 2. Europa
    const europaSlugs: Record<string, number> = {
      laliga: 140,
      bundesliga: 78,
      premierleague: 39,
      'seriea-italia': 135,
      'ligue1-franca': 61,
      champions_league: 2,
    };
    if (europaSlugs[slug] || [140, 78, 39, 135, 61, 2].includes(id)) {
      let resolvedSlug = slug;
      if (!resolvedSlug) {
        resolvedSlug = Object.keys(europaSlugs).find((k) => europaSlugs[k] === id) || 'laliga';
      }
      return { url: this.PB_EUROPA, slug: resolvedSlug, name: 'PocketBase Europa' };
    }

    // 3. Estaduais (Padrão)
    const estadualSlugs: Record<string, number> = {
      campeonato_paulista: 610,
      campeonato_carioca: 624,
      campeonato_mineiro: 629,
      campeonato_gaucho: 614,
      campeonato_baiano: 617,
      campeonato_paranaense: 616,
      campeonato_cearense: 618,
    };
    let resolvedEstadual = slug;
    if (!resolvedEstadual) {
      resolvedEstadual = Object.keys(estadualSlugs).find((k) => estadualSlugs[k] === id) || 'campeonato_paulista';
    }
    return { url: this.PB_ESTADUAIS, slug: resolvedEstadual, name: 'PocketBase Estaduais' };
  }

  /**
   * Dispara notificação push broadcast para a instância PocketBase correspondente
   */
  async sendBroadcast(dto: BroadcastPushDto) {
    const target = this.resolvePocketBaseTarget(dto.leagueId, dto.appSlug);
    this.logger.log(`📢 Disparando Broadcast Push para [${target.name}] (AppSlug: ${target.slug})`);

    const payload = {
      appSlug: target.slug,
      title: dto.title,
      body: dto.body,
      imageUrl: dto.imageUrl || '',
      dataPayload: dto.dataPayload || { app_slug: target.slug },
    };

    try {
      const response = await axios.post(`${target.url}/api/broadcast-push`, payload, { timeout: 15000 });
      return {
        success: true,
        target: target.name,
        appSlug: target.slug,
        details: response.data,
      };
    } catch (err: any) {
      this.logger.error(`❌ Erro ao disparar push no ${target.name}: ${err.message}`);
      return {
        success: false,
        target: target.name,
        appSlug: target.slug,
        error: err.response?.data?.error || err.message,
      };
    }
  }

  /**
   * Gera o resumo conciso e direto de placares da última rodada finalizada de uma liga
   */
  async getRoundSummary(leagueId: number, season: number = 2026) {
    try {
      const fixtures = await this.prisma.fixture.findMany({
        where: {
          league: { externalId: Number(leagueId) },
          season: Number(season),
          statusShort: { in: ['FT', 'AET', 'PEN', '1H', '2H', 'HT', 'LIVE'] },
        },
        include: {
          homeTeam: true,
          awayTeam: true,
        },
        orderBy: {
          date: 'desc',
        },
        take: 50,
      });

      if (!fixtures || fixtures.length === 0) {
        return { success: false, message: 'Nenhuma partida finalizada recente encontrada para esta liga.' };
      }

      // Agrupa por rodada (round)
      const roundsMap: Record<string, any[]> = {};
      fixtures.forEach((f) => {
        const roundName = f.round || 'Rodada Atual';
        if (!roundsMap[roundName]) roundsMap[roundName] = [];
        roundsMap[roundName].push(f);
      });

      // Encontra a rodada mais recente que possui jogos realizados
      const latestRound = Object.keys(roundsMap)[0];
      const roundFixtures = roundsMap[latestRound];

      const finishedMatches = roundFixtures.filter((f) => ['FT', 'AET', 'PEN'].includes(f.statusShort || f.status)).length;
      const isCompleted = finishedMatches > 0 && finishedMatches === roundFixtures.length;

      // Formata nome amigável da rodada (ex: Regular Season - 23 -> 23ª Rodada)
      const formattedRound = latestRound.replace(/Regular Season - (\d+)/i, '$1ª Rodada').replace(/Round (\d+)/i, '$1ª Rodada');

      const scoresList = roundFixtures
        .filter((f) => ['FT', 'AET', 'PEN'].includes(f.statusShort || f.status))
        .map((f) => {
          const hName = f.homeTeam?.name || 'Mandante';
          const aName = f.awayTeam?.name || 'Visitante';
          const hScore = f.homeScore ?? 0;
          const aScore = f.awayScore ?? 0;
          return `${hName} ${hScore}x${aScore} ${aName}`;
        })
        .join(' | ');

      return {
        success: true,
        round: formattedRound,
        isCompleted,
        totalMatches: roundFixtures.length,
        finishedMatches: finishedMatches,
        suggestedTitle: isCompleted ? `🏁 Fim da ${formattedRound}` : `⚽ Resultados da ${formattedRound}`,
        suggestedBody: scoresList || 'Confira todos os lances e estatísticas completas no aplicativo.',
      };
    } catch (e: any) {
      this.logger.error(`Erro ao gerar resumo da rodada: ${e.message}`);
      return { success: false, error: e.message };
    }
  }

  /**
   * Monitora jogos que começam em breve (< 60 min) com escalações confirmadas
   */
  async getLineupAlerts(leagueId?: number) {
    try {
      const now = new Date();
      const in60Min = new Date(now.getTime() + 60 * 60 * 1000);

      const whereClause: any = {
        date: {
          gte: now,
          lte: in60Min,
        },
        status: 'NS',
      };

      if (leagueId) {
        whereClause.league = { externalId: Number(leagueId) };
      }

      const upcomingFixtures = await this.prisma.fixture.findMany({
        where: whereClause,
        include: {
          homeTeam: true,
          awayTeam: true,
          league: true,
        },
      });

      return {
        success: true,
        count: upcomingFixtures.length,
        fixtures: upcomingFixtures.map((f) => ({
          fixtureId: f.externalId,
          leagueId: f.leagueId,
          leagueName: f.league?.name,
          homeTeam: f.homeTeam?.name,
          awayTeam: f.awayTeam?.name,
          date: f.date,
          suggestedTitle: `📋 Escalações Confirmadas: ${f.homeTeam?.name} x ${f.awayTeam?.name}!`,
          suggestedBody: `Confira os 11 titulares de cada time no aplicativo antes da bola rolar.`,
        })),
      };
    } catch (e: any) {
      this.logger.error(`Erro ao buscar alertas de escalação: ${e.message}`);
      return { success: false, error: e.message };
    }
  }
}
