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

    // Fallback 2 específico Amapaense (ID 521): busca os 8 clubes oficiais
    if (leagueExternalId === 521 && teams.length < 8) {
      const canonicalExtIds = [2224, 7785, 10858, 10861, 7848, 270734, 78216, 15622];
      const foundTeams = await this.prisma.team.findMany({
        where: { externalId: { in: canonicalExtIds } },
      });
      const existingIds = new Set(teams.map((t) => t.externalId));
      for (const ft of foundTeams) {
        if (!existingIds.has(ft.externalId)) {
          teams.push(ft);
        }
      }
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
        let squadRecord = await (this.prisma as any).teamSquad.findUnique({
          where: { teamExternalId: team.externalId },
        });

        // Auto-seed para Amapaense se o clube não tiver squad cadastrado
        if ((!squadRecord || !squadRecord.squadJson) && leagueExternalId === 521) {
          const defaultAmapaenseSquads: Record<number, any[]> = {
            2224: [
              { id: 222401, name: 'Vitor Hugo', position: 'Goalkeeper', number: 1, age: 31, photo: 'https://cdn-img.staticzz.com/img/jogadores/31/349831_med__20260301120000.png' },
              { id: 222402, name: 'Felipe Macapá', position: 'Defender', number: 3, age: 28, photo: '' },
              { id: 222403, name: 'Daniel Silva', position: 'Defender', number: 4, age: 26, photo: '' },
              { id: 222404, name: 'Rubens Lucas', position: 'Midfielder', number: 8, age: 27, photo: '' },
              { id: 222405, name: 'Silvio', position: 'Midfielder', number: 10, age: 29, photo: '' },
              { id: 222406, name: 'Aleilson', position: 'Attacker', number: 9, age: 38, photo: 'https://cdn-img.staticzz.com/img/jogadores/45/14545_med__20260215100000.png' },
            ],
            7785: [
              { id: 778501, name: 'Matheus Carioca', position: 'Goalkeeper', number: 1, age: 27, photo: '' },
              { id: 778502, name: 'Batata', position: 'Defender', number: 2, age: 29, photo: '' },
              { id: 778503, name: 'Dudu', position: 'Midfielder', number: 7, age: 24, photo: '' },
              { id: 778504, name: 'Luciano', position: 'Attacker', number: 11, age: 26, photo: '' },
            ],
            10858: [
              { id: 1085801, name: 'Lucas Bento', position: 'Goalkeeper', number: 1, age: 25, photo: '' },
              { id: 1085802, name: 'Tarta', position: 'Midfielder', number: 10, age: 30, photo: '' },
              { id: 1085803, name: 'Abuda', position: 'Attacker', number: 9, age: 28, photo: '' },
            ],
            10861: [
              { id: 1086101, name: 'Wanderson', position: 'Goalkeeper', number: 1, age: 26, photo: '' },
              { id: 1086102, name: 'Kaio', position: 'Defender', number: 5, age: 24, photo: '' },
              { id: 1086103, name: 'Marquinhos', position: 'Attacker', number: 7, age: 25, photo: '' },
            ],
            7848: [
              { id: 784801, name: 'Rafael', position: 'Goalkeeper', number: 12, age: 26, photo: '' },
              { id: 784802, name: 'Guilherme', position: 'Defender', number: 4, age: 23, photo: '' },
              { id: 784803, name: 'Tony Love', position: 'Attacker', number: 9, age: 32, photo: '' },
            ],
            270734: [
              { id: 27073401, name: 'Diego', position: 'Goalkeeper', number: 1, age: 24, photo: '' },
              { id: 27073402, name: 'Paulinho', position: 'Midfielder', number: 8, age: 25, photo: '' },
              { id: 27073403, name: 'Luan', position: 'Attacker', number: 11, age: 22, photo: '' },
            ],
            78216: [
              { id: 7821601, name: 'Gabriel', position: 'Goalkeeper', number: 1, age: 23, photo: '' },
              { id: 7821602, name: 'Everton', position: 'Defender', number: 3, age: 27, photo: '' },
              { id: 7821603, name: 'Ronaldo', position: 'Attacker', number: 9, age: 26, photo: '' },
            ],
            15622: [
              { id: 1562201, name: 'Bruno', position: 'Goalkeeper', number: 1, age: 28, photo: '' },
              { id: 1562202, name: 'Rodrigo', position: 'Midfielder', number: 10, age: 29, photo: '' },
              { id: 1562203, name: 'Jean', position: 'Attacker', number: 9, age: 27, photo: '' },
            ],
          };

          const defaultSquad = defaultAmapaenseSquads[team.externalId];
          if (defaultSquad) {
            try {
              squadRecord = await (this.prisma as any).teamSquad.upsert({
                where: { teamExternalId: team.externalId },
                update: { squadJson: JSON.stringify(defaultSquad) },
                create: {
                  teamExternalId: team.externalId,
                  squadJson: JSON.stringify(defaultSquad),
                },
              });
            } catch (_) {}
          }
        }

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
   * Criação cirúrgica de um novo atleta no plantel do clube
   */
  async createPlayer(data: {
    name: string;
    position: string;
    number?: number;
    age?: number;
    photo?: string;
    teamExternalId: number;
  }) {
    const teamExternalId = Number(data.teamExternalId);
    const newId = teamExternalId * 1000 + Math.floor(Math.random() * 899 + 100);
    const newPlayer = {
      id: newId,
      name: data.name.trim(),
      position: data.position || 'Player',
      number: data.number ? Number(data.number) : null,
      age: data.age ? Number(data.age) : null,
      photo: data.photo ? data.photo.trim() : '',
    };

    let squad: any[] = [];
    try {
      const record = await (this.prisma as any).teamSquad.findUnique({
        where: { teamExternalId },
      });
      if (record && record.squadJson) {
        const parsed = JSON.parse(record.squadJson);
        if (Array.isArray(parsed)) squad = parsed;
      }
      squad.push(newPlayer);

      await (this.prisma as any).teamSquad.upsert({
        where: { teamExternalId },
        update: { squadJson: JSON.stringify(squad) },
        create: { teamExternalId, squadJson: JSON.stringify(squad) },
      });
    } catch (err) {
      console.error('Erro ao salvar no TeamSquad:', err);
    }

    try {
      await this.prisma.player.upsert({
        where: { externalId: newId },
        update: {
          name: newPlayer.name,
          photo: newPlayer.photo || null,
          age: newPlayer.age,
        },
        create: {
          externalId: newId,
          name: newPlayer.name,
          photo: newPlayer.photo || null,
          age: newPlayer.age,
        },
      });
    } catch (_) {}

    return { success: true, player: newPlayer };
  }

  /**
   * Atualização cadastral completa de um atleta no plantel
   */
  async updatePlayer(
    playerId: number,
    data: {
      name?: string;
      position?: string;
      number?: number;
      age?: number;
      photo?: string;
      teamExternalId?: number;
    },
  ) {
    let updatedPlayer: any = null;

    if (data.teamExternalId) {
      try {
        const squadRecord = await (this.prisma as any).teamSquad.findUnique({
          where: { teamExternalId: Number(data.teamExternalId) },
        });

        if (squadRecord && squadRecord.squadJson) {
          const squad = JSON.parse(squadRecord.squadJson);
          if (Array.isArray(squad)) {
            let found = false;
            for (const p of squad) {
              if (p.id === playerId) {
                if (data.name !== undefined) p.name = data.name.trim();
                if (data.position !== undefined) p.position = data.position;
                if (data.number !== undefined) p.number = data.number ? Number(data.number) : null;
                if (data.age !== undefined) p.age = data.age ? Number(data.age) : null;
                if (data.photo !== undefined) p.photo = (data.photo || '').trim();
                updatedPlayer = p;
                found = true;
                break;
              }
            }
            if (found) {
              await (this.prisma as any).teamSquad.update({
                where: { teamExternalId: Number(data.teamExternalId) },
                data: { squadJson: JSON.stringify(squad) },
              });
            }
          }
        }
      } catch (err) {
        console.error('Erro ao atualizar TeamSquad:', err);
      }
    } else {
      // Se teamExternalId não foi passado, procura em todos os squads
      try {
        const allSquads = await (this.prisma as any).teamSquad.findMany();
        for (const sRecord of allSquads) {
          if (sRecord.squadJson) {
            const squad = JSON.parse(sRecord.squadJson);
            if (Array.isArray(squad)) {
              let found = false;
              for (const p of squad) {
                if (p.id === playerId) {
                  if (data.name !== undefined) p.name = data.name.trim();
                  if (data.position !== undefined) p.position = data.position;
                  if (data.number !== undefined) p.number = data.number ? Number(data.number) : null;
                  if (data.age !== undefined) p.age = data.age ? Number(data.age) : null;
                  if (data.photo !== undefined) p.photo = (data.photo || '').trim();
                  updatedPlayer = p;
                  found = true;
                  break;
                }
              }
              if (found) {
                await (this.prisma as any).teamSquad.update({
                  where: { id: sRecord.id },
                  data: { squadJson: JSON.stringify(squad) },
                });
                break;
              }
            }
          }
        }
      } catch (_) {}
    }

    // Propaga em Player, Scorer e FixtureLineup
    try {
      await this.prisma.player.upsert({
        where: { externalId: playerId },
        update: {
          ...(data.name && { name: data.name.trim() }),
          ...(data.photo !== undefined && { photo: (data.photo || '').trim() || null }),
          ...(data.age !== undefined && { age: data.age ? Number(data.age) : null }),
        },
        create: {
          externalId: playerId,
          name: data.name ? data.name.trim() : 'Jogador',
          photo: (data.photo || '').trim() || null,
          age: data.age ? Number(data.age) : null,
        },
      });
    } catch (_) {}

    if (data.name || data.photo !== undefined) {
      const pName = data.name ? data.name.trim() : undefined;
      const pPhoto = (data.photo || '').trim() || null;
      if (pName) {
        try {
          await this.prisma.scorer.updateMany({
            where: { playerName: pName },
            data: { ...(pPhoto && { playerPhoto: pPhoto }) },
          });
          await this.prisma.fixtureLineup.updateMany({
            where: { player: pName },
            data: { ...(pPhoto && { playerPhoto: pPhoto }) },
          });
        } catch (_) {}
      }
    }

    return { success: true, playerId, player: updatedPlayer };
  }

  /**
   * Remoção cirúrgica de um atleta do plantel
   */
  async deletePlayer(playerId: number, teamExternalId?: number) {
    let deleted = false;
    try {
      if (teamExternalId) {
        const squadRecord = await (this.prisma as any).teamSquad.findUnique({
          where: { teamExternalId: Number(teamExternalId) },
        });
        if (squadRecord && squadRecord.squadJson) {
          const squad = JSON.parse(squadRecord.squadJson);
          if (Array.isArray(squad)) {
            const initialLen = squad.length;
            const filtered = squad.filter((p: any) => p.id !== playerId);
            if (filtered.length < initialLen) {
              await (this.prisma as any).teamSquad.update({
                where: { teamExternalId: Number(teamExternalId) },
                data: { squadJson: JSON.stringify(filtered) },
              });
              deleted = true;
            }
          }
        }
      } else {
        const allSquads = await (this.prisma as any).teamSquad.findMany();
        for (const sRecord of allSquads) {
          if (sRecord.squadJson) {
            const squad = JSON.parse(sRecord.squadJson);
            if (Array.isArray(squad)) {
              const initialLen = squad.length;
              const filtered = squad.filter((p: any) => p.id !== playerId);
              if (filtered.length < initialLen) {
                await (this.prisma as any).teamSquad.update({
                  where: { id: sRecord.id },
                  data: { squadJson: JSON.stringify(filtered) },
                });
                deleted = true;
                break;
              }
            }
          }
        }
      }
    } catch (err) {
      console.error('Erro ao deletar do TeamSquad:', err);
    }

    return { success: deleted, playerId };
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
