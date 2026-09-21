import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { PocketBaseSyncService } from '../integrations/pocketbase/pocketbase-sync.service';
import { ApiFootballService } from '../integrations/api-football/api-football.service';

export interface ScorerAggregateResult {
  success: boolean;
  leagueId: number;
  leagueName: string;
  season: number;
  totalGoalsFound: number;
  topScorersCount: number;
  source?: 'official' | 'calculated';
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
    private readonly apiFootball: ApiFootballService,
  ) {}

  /**
   * Executa a sincronização e cálculo de artilharia híbrida idempotente para uma liga específica:
   * 1. Prioridade Primária: Consulta a API-Football oficial (/players/topscorers) -> 1 req leve.
   * 2. Fallback Autônomo: Se results === 0 (ligas menores/estaduais), calcula via eventos locais de partidas.
   * 3. Erradicação de deleteMany(): Sempre grava via upsert cirúrgico na chave composta.
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
        `[ScorerAgent ⚽] Iniciando verificação de artilharia para ${league.name} (ExtID: ${league.externalId}, Season: ${targetSeason})...`,
      );

      // =========================================================================
      // CAMADA 1: Prioridade Primária — Oficial API-Football
      // =========================================================================
      let officialScorers: any[] = [];
      try {
        const response = await this.apiFootball.getTopScorers({
          league: league.externalId,
          season: targetSeason,
        });

        if (Array.isArray(response) && response.length > 0) {
          officialScorers = response;
        }
      } catch (err: any) {
        this.logger.warn(
          `[ScorerAgent] Consulta oficial API-Football para ${league.name} falhou: ${err.message}. Acionando fallback...`,
        );
      }

      if (officialScorers.length > 0) {
        this.logger.log(
          `[ScorerAgent 🟢 OFICIAL] ${officialScorers.length} artilheiros oficiais recebidos da API-Football para ${league.name}. Aplicando upsert cirúrgico...`,
        );

        let totalGoals = 0;

        for (const [index, item] of officialScorers.entries()) {
          const stats = item.statistics?.[0];
          const player = item.player;

          if (!player?.name || !stats?.team?.name) continue;

          const photo =
            player.photo ||
            (player.id
              ? `https://media.api-sports.io/football/players/${player.id}.png`
              : null);
          const goals = Number(stats.goals?.total || 0);
          const assists = Number(stats.goals?.assists || 0);
          totalGoals += goals;

          const savedScorer = await this.prisma.scorer.upsert({
            where: {
              leagueId_season_playerName_teamName: {
                leagueId: league.id,
                season: targetSeason,
                playerName: player.name,
                teamName: stats.team.name,
              },
            },
            update: {
              rank: index + 1,
              playerPhoto: photo,
              teamLogo: stats.team.logo || null,
              goals,
              assists,
              externalPlayerId: player.id || null,
            },
            create: {
              leagueId: league.id,
              season: targetSeason,
              rank: index + 1,
              playerName: player.name,
              playerPhoto: photo,
              teamName: stats.team.name,
              teamLogo: stats.team.logo || null,
              goals,
              assists,
              externalPlayerId: player.id || null,
            },
          });

          // Sincronização secundária com PocketBase (não-bloqueante)
          try {
            await this.pocketbaseSync.syncScorer(
              {
                ...savedScorer,
                season: targetSeason,
              },
              league.externalId,
            );
          } catch (pbErr) {
            // PocketBase opcional
          }
        }

        // Saneamento Cirúrgico: Remove apenas resíduos/duplicatas antigas que não constam na lista oficial da federação
        const officialNames = officialScorers
          .map((item) => item.player?.name)
          .filter(Boolean);
        if (officialNames.length > 0) {
          const purged = await this.prisma.scorer.deleteMany({
            where: {
              leagueId: league.id,
              season: targetSeason,
              playerName: { notIn: officialNames },
            },
          });
          if (purged.count > 0) {
            this.logger.log(
              `[ScorerAgent 🧹 SANEAMENTO] Removidos ${purged.count} registros órfãos/duplicados antigos de ${league.name}.`,
            );
          }
        }

        // Invalidação do Cache Redis
        await this.redis.delPattern('topscorers:*');

        this.logger.log(
          `[ScorerAgent 🟢 OFICIAL ✅] Artilharia oficial de ${league.name} sincronizada com sucesso (${officialScorers.length} atletas, ${totalGoals} gols)!`,
        );

        return {
          success: true,
          leagueId: league.externalId,
          leagueName: league.name,
          season: targetSeason,
          totalGoalsFound: totalGoals,
          topScorersCount: officialScorers.length,
          source: 'official',
        };
      }

      // =========================================================================
      // CAMADA 2: Fallback Autônomo — Detecção de Ausência Oficial (Eventos Locais)
      // =========================================================================
      this.logger.log(
        `[ScorerAgent 🟡 FALLBACK] Liga ${league.name} (${league.externalId}) sem cobertura oficial na API-Football. Ativando motor de cálculo por eventos locais...`,
      );

      // Busca partidas da temporada com eventos e equipes
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

      // Varrer eventos de gols
      for (const fixture of fixtures) {
        if (!fixture.events || fixture.events.length === 0) continue;

        for (const event of fixture.events) {
          const type = (event.type || '').toLowerCase();
          if (type !== 'goal') continue;

          const detail = (event.detail || '').toLowerCase();

          // Ignora Gol Contra
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

          const isPenalty =
            detail.includes('penalty') || detail.includes('pênalti');
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

      // Ordenação Idempotente
      const sortedScorers = Array.from(playerScorersMap.values()).sort(
        (a, b) => {
          if (b.goals !== a.goals) return b.goals - a.goals;
          if (a.penalties !== b.penalties) return a.penalties - b.penalties;
          return a.playerName.localeCompare(b.playerName);
        },
      );

      this.logger.log(
        `[ScorerAgent 🟡 CALCULADO] Agregados ${sortedScorers.length} artilheiros (${totalGoalsFound} gols) via eventos para ${league.name}. Gravando via upsert...`,
      );

      // Gravação cirúrgica via upsert (SEM deleteMany)
      for (let i = 0; i < sortedScorers.length; i++) {
        const item = sortedScorers[i];
        const rank = i + 1;

        const savedScorer = await this.prisma.scorer.upsert({
          where: {
            leagueId_season_playerName_teamName: {
              leagueId: league.id,
              season: targetSeason,
              playerName: item.playerName,
              teamName: item.teamName,
            },
          },
          update: {
            rank,
            playerPhoto: item.playerPhoto,
            teamLogo: item.teamLogo,
            goals: item.goals,
            assists: item.assists,
            externalPlayerId: item.externalPlayerId,
          },
          create: {
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
          // PocketBase opcional
        }
      }

      // Invalidação do Cache Redis
      await this.redis.delPattern('topscorers:*');

      this.logger.log(
        `[ScorerAgent 🟡 CALCULADO ✅] Artilharia por eventos de ${league.name} consolidada com sucesso!`,
      );

      return {
        success: true,
        leagueId: league.externalId,
        leagueName: league.name,
        season: targetSeason,
        totalGoalsFound,
        topScorersCount: sortedScorers.length,
        source: 'calculated',
      };
    } catch (err: any) {
      this.logger.error(
        `[ScorerAgent ❌] Erro ao sincronizar artilharia de ${leagueIdOrExtId}: ${err.message}`,
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
