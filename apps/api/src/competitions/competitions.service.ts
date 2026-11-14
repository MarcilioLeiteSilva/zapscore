import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ApiFootballService } from '../integrations/api-football/api-football.service';
import { RedisService } from '../redis/redis.service';
import { SUPPORTED_COMPETITIONS, CompetitionConfig } from '../config/competitions.config';

@Injectable()
export class CompetitionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly apiFootball: ApiFootballService,
    private readonly redis: RedisService,
  ) {}

  findAll(): CompetitionConfig[] {
    return SUPPORTED_COMPETITIONS;
  }

  findOneByExternalId(externalId: number): CompetitionConfig | undefined {
    return SUPPORTED_COMPETITIONS.find((c) => c.externalId === externalId);
  }

  async getStoredLeagues() {
    const supportedExternalIds = SUPPORTED_COMPETITIONS.map((c) => c.externalId);
    return this.prisma.league.findMany({
      where: {
        externalId: { in: supportedExternalIds },
      },
      orderBy: { name: 'asc' },
    });
  }

  async getStoredLeagueByExternalId(externalId: number) {
    return this.prisma.league.findUnique({
      where: { externalId },
    });
  }

  async getTopScorers(leagueId: number, season: number) {
    const cacheKey = `topscorers:local:${leagueId}:${season}`;
    const cached = await this.redis.getJson(cacheKey);
    if (cached) return cached;

    const league = await this.prisma.league.findUnique({
      where: { externalId: leagueId },
    });

    if (!league) return [];

    const scorers = await this.prisma.scorer.findMany({
      where: {
        leagueId: league.id,
        season,
      },
      orderBy: { rank: 'asc' },
    });

    // Cache por 1 hora
    if (scorers.length > 0) {
      await this.redis.setJson(cacheKey, scorers, 3600);
    }
    
    return scorers;
  }

  async createScorer(data: any) {
    const season = Number(data.season || 2026);

    // Resolve leagueId se for externalId numérico
    let targetLeagueUuid = data.leagueId;
    const numericExtId = parseInt(data.leagueId, 10);
    if (!isNaN(numericExtId)) {
      const league = await this.prisma.league.findUnique({ where: { externalId: numericExtId } });
      if (league) targetLeagueUuid = league.id;
    }

    const scorer = await this.prisma.scorer.create({
      data: {
        leagueId: targetLeagueUuid,
        season,
        rank: Number(data.rank || 1),
        playerName: data.playerName,
        playerPhoto: data.playerPhoto || null,
        teamName: data.teamName,
        teamLogo: data.teamLogo || null,
        goals: Number(data.goals || 0),
        assists: Number(data.assists || 0),
      },
    });
    await this.redis.delPattern('topscorers:*');
    return scorer;
  }

  async updateScorer(id: string, data: any) {
    const updated = await this.prisma.scorer.update({
      where: { id },
      data: {
        ...(data.rank !== undefined && { rank: Number(data.rank) }),
        ...(data.playerName && { playerName: data.playerName }),
        ...(data.playerPhoto !== undefined && { playerPhoto: data.playerPhoto }),
        ...(data.teamName && { teamName: data.teamName }),
        ...(data.teamLogo !== undefined && { teamLogo: data.teamLogo }),
        ...(data.goals !== undefined && { goals: Number(data.goals) }),
      },
    });
    await this.redis.delPattern('topscorers:*');
    return updated;
  }

  async deleteScorer(id: string) {
    const deleted = await this.prisma.scorer.delete({
      where: { id },
    });
    await this.redis.delPattern('topscorers:*');
    return deleted;
  }

  /**
   * Lista todos os jogadores dos clubes de uma competição para gestão no AdminPanel
   */
  async getCompetitionPlayers(leagueExternalId: number, season: number = 2026) {
    const league = await this.prisma.league.findUnique({
      where: { externalId: leagueExternalId },
    });

    if (!league) return [];

    // Busca times presentes na classificação ou partidas da liga
    let standings = await this.prisma.standing.findMany({
      where: { leagueId: league.id, season },
      include: { team: true },
      orderBy: { rank: 'asc' },
    });

    if (standings.length === 0 && season !== 2027) {
      standings = await this.prisma.standing.findMany({
        where: { leagueId: league.id, season: 2027 },
        include: { team: true },
        orderBy: { rank: 'asc' },
      });
    }

    let teams = standings.map((s) => s.team);

    // Fallback: se standings ainda não estiver populado, busca times pelas fixtures
    if (teams.length === 0) {
      const fixtures = await this.prisma.fixture.findMany({
        where: { leagueId: league.id },
        include: { homeTeam: true, awayTeam: true },
        take: 30,
      });
      const teamMap = new Map<number, any>();
      for (const f of fixtures) {
        if (f.homeTeam) teamMap.set(f.homeTeam.externalId, f.homeTeam);
        if (f.awayTeam) teamMap.set(f.awayTeam.externalId, f.awayTeam);
      }
      teams = Array.from(teamMap.values());
    }

    const allPlayers: Array<{
      id: number;
      name: string;
      number: number | null;
      position: string;
      age: number | null;
      photo: string | null;
      teamId: string;
      teamExternalId: number;
      teamName: string;
      teamLogo: string | null;
    }> = [];

    for (const team of teams) {
      try {
        const squadRecord = await (this.prisma as any).teamSquad.findUnique({
          where: { teamExternalId: team.externalId },
        });

        if (squadRecord && squadRecord.squadJson) {
          const players = JSON.parse(squadRecord.squadJson);
          if (Array.isArray(players)) {
            for (const p of players) {
              allPlayers.push({
                id: p.id,
                name: p.name,
                number: p.number ?? null,
                position: p.position || 'Player',
                age: p.age ?? null,
                photo: p.photo || null,
                teamId: team.id,
                teamExternalId: team.externalId,
                teamName: team.name,
                teamLogo: team.logo,
              });
            }
          }
        }
      } catch (err) {
        // Continua para o próximo time
      }
    }

    return allPlayers;
  }

  /**
   * Atualização manual cirúrgica da foto de um atleta com propagação em cascata (TeamSquad, Player, Scorer, Lineup)
   */
  async updatePlayerPhoto(
    playerId: number,
    data: { photo: string; teamExternalId?: number; playerName?: string },
  ) {
    const photoUrl = (data.photo || '').trim();

    // 1. Atualizar ou Criar registro na tabela Player
    try {
      await this.prisma.player.upsert({
        where: { externalId: playerId },
        update: { photo: photoUrl || null },
        create: {
          externalId: playerId,
          name: data.playerName || 'Jogador',
          photo: photoUrl || null,
        },
      });
    } catch (_) {}

    // 2. Atualizar no TeamSquad do clube
    if (data.teamExternalId) {
      try {
        const squadRecord = await (this.prisma as any).teamSquad.findUnique({
          where: { teamExternalId: data.teamExternalId },
        });

        if (squadRecord && squadRecord.squadJson) {
          const squad = JSON.parse(squadRecord.squadJson);
          if (Array.isArray(squad)) {
            let updated = false;
            for (const p of squad) {
              if (
                p.id === playerId ||
                (data.playerName && p.name.toLowerCase() === data.playerName.toLowerCase())
              ) {
                p.photo = photoUrl || null;
                updated = true;
              }
            }
            if (updated) {
              await (this.prisma as any).teamSquad.update({
                where: { teamExternalId: data.teamExternalId },
                data: { squadJson: JSON.stringify(squad) },
              });
            }
          }
        }
      } catch (_) {}
    }

    // 3. Atualizar nas tabelas de artilharia e súmulas
    if (data.playerName) {
      try {
        await this.prisma.scorer.updateMany({
          where: { playerName: data.playerName },
          data: { playerPhoto: photoUrl || null },
        });
      } catch (_) {}

      try {
        await this.prisma.fixtureLineup.updateMany({
          where: { player: data.playerName },
          data: { playerPhoto: photoUrl || null },
        });
      } catch (_) {}
    }

    return { success: true, playerId, photo: photoUrl };
  }
}
