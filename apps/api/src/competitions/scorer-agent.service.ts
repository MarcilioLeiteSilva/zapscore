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
        `[ScorerAgent ⚽] Iniciando auditoria e reconciliação factual de artilharia para ${league.name} (ExtID: ${league.externalId}, Season: ${targetSeason})...`,
      );

      // 2. Extrai os gols registrados em eventos locais de partidas (Tempo Real)
      const localScorersMap = await this.getLocalScorersMap(league.id, targetSeason);

      // 3. Mapeia os registros já existentes no banco (para preservação de edições e não-regressão)
      const existingScorers = await this.prisma.scorer.findMany({
        where: {
          leagueId: league.id,
          season: targetSeason,
        },
      });

      const existingByNameAndTeam = new Map<string, any>();
      const existingByExtPlayerId = new Map<number, any>();
      for (const s of existingScorers) {
        const key = `${s.playerName.toLowerCase().trim()}_${s.teamName.toLowerCase().trim()}`;
        existingByNameAndTeam.set(key, s);
        if (s.externalPlayerId) {
          existingByExtPlayerId.set(s.externalPlayerId, s);
        }
      }

      // =========================================================================
      // CAMADA 1: Consulta à API Oficial da Federação (API-Football)
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
          `[ScorerAgent] Consulta oficial API-Football para ${league.name} falhou: ${err.message}. Operando com eventos locais...`,
        );
      }

      let source: 'official' | 'calculated' = 'calculated';
      const processedLocalKeys = new Set<string>();

      if (officialScorers.length > 0) {
        source = 'official';
        this.logger.log(
          `[ScorerAgent 🟢 OFICIAL] ${officialScorers.length} artilheiros oficiais recebidos da API-Football para ${league.name}. Aplicando reconciliação não-regressiva...`,
        );

        for (const [index, item] of officialScorers.entries()) {
          const stats = item.statistics?.[0];
          const player = item.player;

          if (!player?.name || !stats?.team?.name) continue;

          const playerName = player.name.trim();
          const teamName = stats.team.name.trim();
          const lookupKey = `${playerName.toLowerCase()}_${teamName.toLowerCase()}`;

          // Localiza registro existente no banco (por chave composta ou por externalId)
          const existing =
            existingByNameAndTeam.get(lookupKey) ||
            (player.id ? existingByExtPlayerId.get(player.id) : null);

          // Localiza evento local correspondente
          const localItem = localScorersMap.get(lookupKey);
          if (localItem) {
            processedLocalKeys.add(lookupKey);
          }

          const officialGoals = Number(stats.goals?.total || 0);
          const officialAssists = Number(stats.goals?.assists || 0);
          const localGoals = localItem ? localItem.goals : 0;
          const localAssists = localItem ? localItem.assists : 0;
          const existingGoals = existing ? Number(existing.goals || 0) : 0;
          const existingAssists = existing ? Number(existing.assists || 0) : 0;

          // REGRA DE NÃO-REGRESSÃO FOCADA NA VERDADE FACTUAL:
          // O número de gols de um atleta nunca diminui devido a atrasos da API oficial.
          const effectiveGoals = Math.max(existingGoals, officialGoals, localGoals);
          const effectiveAssists = Math.max(existingAssists, officialAssists, localAssists);

          const photo =
            player.photo ||
            (player.id
              ? `https://media.api-sports.io/football/players/${player.id}.png`
              : existing?.playerPhoto || null);

          const teamLogo = stats.team.logo || existing?.teamLogo || null;

          const savedScorer = await this.prisma.scorer.upsert({
            where: {
              leagueId_season_playerName_teamName: {
                leagueId: league.id,
                season: targetSeason,
                playerName,
                teamName,
              },
            },
            update: {
              playerPhoto: photo,
              teamLogo,
              goals: effectiveGoals,
              assists: effectiveAssists,
              externalPlayerId: player.id || existing?.externalPlayerId || null,
            },
            create: {
              leagueId: league.id,
              season: targetSeason,
              rank: index + 1,
              playerName,
              playerPhoto: photo,
              teamName,
              teamLogo,
              goals: effectiveGoals,
              assists: effectiveAssists,
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
      }

      // =========================================================================
      // CAMADA 2 & OVERFLOW: Preservação de Atletas Locais / Fora do Top 20 Oficial
      // =========================================================================
      // Atletas que pontuaram em eventos locais mas não constam na lista oficial da API
      // NUNCA são deletados. São preservados e atualizados cirurgicamente.
      for (const [key, localItem] of localScorersMap.entries()) {
        if (processedLocalKeys.has(key)) continue;

        const existing = existingByNameAndTeam.get(key);
        const existingGoals = existing ? Number(existing.goals || 0) : 0;
        const existingAssists = existing ? Number(existing.assists || 0) : 0;

        const effectiveGoals = Math.max(existingGoals, localItem.goals);
        const effectiveAssists = Math.max(existingAssists, localItem.assists);

        if (effectiveGoals <= 0) continue;

        const savedScorer = await this.prisma.scorer.upsert({
          where: {
            leagueId_season_playerName_teamName: {
              leagueId: league.id,
              season: targetSeason,
              playerName: localItem.playerName,
              teamName: localItem.teamName,
            },
          },
          update: {
            playerPhoto: localItem.playerPhoto || existing?.playerPhoto || null,
            teamLogo: localItem.teamLogo || existing?.teamLogo || null,
            goals: effectiveGoals,
            assists: effectiveAssists,
            externalPlayerId: localItem.externalPlayerId || existing?.externalPlayerId || null,
          },
          create: {
            leagueId: league.id,
            season: targetSeason,
            rank: 999,
            playerName: localItem.playerName,
            playerPhoto: localItem.playerPhoto || null,
            teamName: localItem.teamName,
            teamLogo: localItem.teamLogo || null,
            goals: effectiveGoals,
            assists: effectiveAssists,
            externalPlayerId: localItem.externalPlayerId || null,
          },
        });

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

      // =========================================================================
      // 4. REORDENAÇÃO IDEMPOTENTE DE RANKS (1º, 2º, 3º...)
      // =========================================================================
      // Substitui o deleteMany destrutivo: os atletas são classificados por ordem
      // decrescente de gols e assistências.
      const allScorers = await this.prisma.scorer.findMany({
        where: {
          leagueId: league.id,
          season: targetSeason,
        },
        orderBy: [
          { goals: 'desc' },
          { assists: 'desc' },
          { playerName: 'asc' },
        ],
      });

      let totalGoals = 0;
      for (let i = 0; i < allScorers.length; i++) {
        const s = allScorers[i];
        totalGoals += s.goals;
        const newRank = i + 1;
        if (s.rank !== newRank) {
          await this.prisma.scorer.update({
            where: { id: s.id },
            data: { rank: newRank },
          });
        }
      }

      // Invalidação do Cache Redis
      await this.redis.delPattern('topscorers:*');

      this.logger.log(
        `[ScorerAgent ✅ RECONCILIADO] Artilharia de ${league.name} consolidada com sucesso (${allScorers.length} atletas, ${totalGoals} gols totais, Origem: ${source})!`,
      );

      return {
        success: true,
        leagueId: league.externalId,
        leagueName: league.name,
        season: targetSeason,
        totalGoalsFound: totalGoals,
        topScorersCount: allScorers.length,
        source,
      };
    } catch (err: any) {
      this.logger.error(
        `[ScorerAgent ❌] Erro ao reconciliar artilharia de ${leagueIdOrExtId}: ${err.message}`,
        err.stack,
      );
      throw err;
    } finally {
      this.activeLocks.delete(lockKey);
    }
  }

  /**
   * Varre todos os eventos de partidas já registradas no banco para compor
   * o mapa de artilharia factual em tempo real por jogador.
   */
  private async getLocalScorersMap(leagueDbId: string, season: number) {
    const fixtures = await this.prisma.fixture.findMany({
      where: {
        leagueId: leagueDbId,
        season,
      },
      include: {
        events: true,
        homeTeam: true,
        awayTeam: true,
      },
    });

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

    for (const fixture of fixtures) {
      if (!fixture.events || fixture.events.length === 0) continue;

      for (const event of fixture.events) {
        const type = (event.type || '').toLowerCase();
        if (type !== 'goal') continue;

        const detail = (event.detail || '').toLowerCase();
        if (
          detail.includes('own goal') ||
          detail.includes('contra') ||
          detail.includes('autogol')
        ) {
          continue;
        }

        const rawPlayerName = (event.player || '').trim();
        if (!rawPlayerName || rawPlayerName === 'Desconhecido') continue;

        let teamName = 'Desconhecido';
        let teamLogo: string | null = null;
        if (fixture.homeTeam && event.teamId === fixture.homeTeam.externalId) {
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

    return playerScorersMap;
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
