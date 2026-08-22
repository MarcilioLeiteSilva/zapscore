import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { PocketBaseSyncService } from '../integrations/pocketbase/pocketbase-sync.service';

export interface ScorerAggregateResult {
  success: boolean;
  leagueId: number;
  leagueName: string;
  season: number;
  totalGoalsFound: number;
  topScorersCount: number;
  message?: string;
}

@Injectable()
export class ScorerAgentService {
  private readonly logger = new Logger(ScorerAgentService.name);
  private readonly activeLocks = new Set<string>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly pocketbaseSync: PocketBaseSyncService,
  ) {}

  /**
   * Executa o cálculo de artilharia idempotente para uma liga específica.
   */
  async aggregateLeagueScorers(
    leagueIdOrExtId: string | number,
    targetSeason: number = 2026,
  ): Promise<ScorerAggregateResult> {
    const lockKey = `league_${leagueIdOrExtId}_${targetSeason}`;

    // Trava de Concorrência (Lock / Debounce)
    if (this.activeLocks.has(lockKey)) {
      this.logger.warn(
        `[ScorerAgent] Sincronização da liga ${leagueIdOrExtId} já está em andamento. Ignorando chamada concorrente.`,
      );
      return {
        success: false,
        leagueId: Number(leagueIdOrExtId) || 0,
        leagueName: '',
        season: targetSeason,
        totalGoalsFound: 0,
        topScorersCount: 0,
        message: 'Execução já em andamento (lock ativo)',
      };
    }

    this.activeLocks.add(lockKey);

    try {
      // 1. Localiza a Liga
      let league: any = null;
      const numericExtId = Number(leagueIdOrExtId);
      if (!isNaN(numericExtId)) {
        league = await this.prisma.league.findUnique({
          where: { externalId: numericExtId },
        });
      }
      if (!league && typeof leagueIdOrExtId === 'string') {
        league = await this.prisma.league.findUnique({
          where: { id: leagueIdOrExtId },
        });
      }

      if (!league) {
        this.logger.warn(`[ScorerAgent] Liga não encontrada: ${leagueIdOrExtId}`);
        return {
          success: false,
          leagueId: numericExtId || 0,
          leagueName: 'Desconhecida',
          season: targetSeason,
          totalGoalsFound: 0,
          topScorersCount: 0,
          message: 'Liga não encontrada no banco',
        };
      }

      this.logger.log(
        `[ScorerAgent ⚽] Iniciando agregação de artilharia para ${league.name} (ExtID: ${league.externalId}, Season: ${targetSeason})...`,
      );

      // 2. Busca todas as partidas da temporada com eventos e times
      const fixtures = await this.prisma.fixture.findMany({
        where: {
          leagueId: league.id,
          season: targetSeason,
        },
        include: {
          events: true,
          homeTeam: true,
          awayTeam: true,
        },
      });

      let totalGoalsFound = 0;
      const playerScorersMap = new Map<
        string,
        {
          playerName: string;
          playerPhoto: string | null;
          externalPlayerId: number | null;
          teamName: string;
          teamLogo: string | null;
          goals: number;
          penalties: number;
          assists: number;
        }
      >();

      // 3. Varrer eventos de gols
      for (const fixture of fixtures) {
        if (!fixture.events || fixture.events.length === 0) continue;

        for (const event of fixture.events) {
          const type = (event.type || '').toLowerCase();
          if (type !== 'goal') continue;

          const detail = (event.detail || '').toLowerCase();

          // Ignora Gol Contra para a artilharia do jogador
          if (
            detail.includes('own goal') ||
            detail.includes('contra') ||
            detail.includes('autogol')
          ) {
            continue;
          }

          const rawPlayerName = (event.player || '').trim();
          if (!rawPlayerName || rawPlayerName === 'Desconhecido') continue;

          totalGoalsFound++;

          // Determina o time do evento
          let teamName = 'Desconhecido';
          let teamLogo: string | null = null;
          if (
            fixture.homeTeam &&
            event.teamId === fixture.homeTeam.externalId
          ) {
            teamName = fixture.homeTeam.name;
            teamLogo = fixture.homeTeam.logo;
          } else if (
            fixture.awayTeam &&
            event.teamId === fixture.awayTeam.externalId
          ) {
            teamName = fixture.awayTeam.name;
            teamLogo = fixture.awayTeam.logo;
          }

          const isPenalty = detail.includes('penalty') || detail.includes('pênalti');
          const playerKey = `${rawPlayerName.toLowerCase()}_${teamName.toLowerCase()}`;

          if (!playerScorersMap.has(playerKey)) {
            playerScorersMap.set(playerKey, {
              playerName: rawPlayerName,
              playerPhoto: event.playerPhoto || null,
              externalPlayerId: event.externalPlayerId || null,
              teamName,
              teamLogo,
              goals: 0,
              penalties: 0,
              assists: 0,
            });
          }

          const record = playerScorersMap.get(playerKey)!;
          record.goals += 1;
          if (isPenalty) {
            record.penalties += 1;
          }
          if (event.playerPhoto && !record.playerPhoto) {
            record.playerPhoto = event.playerPhoto;
          }
          if (event.externalPlayerId && !record.externalPlayerId) {
            record.externalPlayerId = event.externalPlayerId;
          }
        }
      }

      // 4. Ordenação Idempotente
      const sortedScorers = Array.from(playerScorersMap.values()).sort(
        (a, b) => {
          if (b.goals !== a.goals) return b.goals - a.goals;
          if (a.penalties !== b.penalties) return a.penalties - b.penalties;
          return a.playerName.localeCompare(b.playerName);
        },
      );

      this.logger.log(
        `[ScorerAgent] Agregados ${sortedScorers.length} artilheiros (${totalGoalsFound} gols) para ${league.name}.`,
      );

      // 5. Atualização no Banco de Dados (Prisma)
      // Remove artilheiros anteriores da temporada para garantir consolidação 100% limpa
      await this.prisma.scorer.deleteMany({
        where: {
          leagueId: league.id,
          season: targetSeason,
        },
      });

      // Insere os novos artilheiros consolidados com seu rank
      for (let i = 0; i < sortedScorers.length; i++) {
        const item = sortedScorers[i];
        const rank = i + 1;

        const savedScorer = await this.prisma.scorer.create({
          data: {
            leagueId: league.id,
            season: targetSeason,
            rank,
            playerName: item.playerName,
            playerPhoto: item.playerPhoto,
            teamName: item.teamName,
            teamLogo: item.teamLogo,
            goals: item.goals,
            assists: item.assists,
            externalPlayerId: item.externalPlayerId,
          },
        });

        // Sincroniza com PocketBase
        try {
          await this.pocketbaseSync.syncScorer(
            {
              ...savedScorer,
              season: targetSeason,
            },
            league.externalId,
          );
        } catch (pbErr) {
          // PocketBase opcional/não bloqueante
        }
      }

      // 6. Invalidação do Cache Redis
      await this.redis.delPattern('topscorers:*');

      this.logger.log(
        `[ScorerAgent ✅] Artilharia de ${league.name} atualizada com sucesso!`,
      );

      return {
        success: true,
        leagueId: league.externalId,
        leagueName: league.name,
        season: targetSeason,
        totalGoalsFound,
        topScorersCount: sortedScorers.length,
      };
    } catch (err) {
      this.logger.error(
        `[ScorerAgent ❌] Erro ao agregar artilharia: ${err.message}`,
        err.stack,
      );
      throw err;
    } finally {
      this.activeLocks.delete(lockKey);
    }
  }

  /**
   * Executa a agregação para todas as ligas registradas no sistema.
   */
  async aggregateAllActiveLeagues(targetSeason: number = 2026) {
    this.logger.log(
      `[ScorerAgent] Iniciando varredura geral de artilharia em todas as ligas (Season ${targetSeason})...`,
    );

    const leagues = await this.prisma.league.findMany();
    const results: ScorerAggregateResult[] = [];

    for (const league of leagues) {
      try {
        const res = await this.aggregateLeagueScorers(
          league.externalId,
          targetSeason,
        );
        results.push(res);
      } catch (err) {
        this.logger.error(
          `[ScorerAgent] Falha ao processar liga ${league.name} (${league.externalId}): ${err.message}`,
        );
      }
    }

    this.logger.log(
      `[ScorerAgent] Varredura geral concluída para ${results.length} ligas.`,
    );
    return results;
  }
}
