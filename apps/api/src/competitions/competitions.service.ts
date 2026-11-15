import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ApiFootballService } from '../integrations/api-football/api-football.service';
import { RedisService } from '../redis/redis.service';
import { SUPPORTED_COMPETITIONS, CompetitionConfig } from '../config/competitions.config';

@Injectable()
export class CompetitionsService {
  private static readonly memorySquads = new Map<number, any[]>();
  private static teamSquadTableEnsured = false;

  /**
   * Garante a existência da tabela TeamSquad (mesmo DDL já utilizado pelos seeders 2027).
   * Idempotente: CREATE TABLE IF NOT EXISTS. Não altera schema.prisma.
   */
  private async ensureTeamSquadTable() {
    if (CompetitionsService.teamSquadTableEnsured) return;
    try {
      await this.prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "TeamSquad" (
          "id" TEXT PRIMARY KEY,
          "teamExternalId" INTEGER NOT NULL UNIQUE,
          "squadJson" TEXT NOT NULL,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
      `);
      CompetitionsService.teamSquadTableEnsured = true;
    } catch (err: any) {
      console.error('Erro ao garantir tabela TeamSquad:', err?.message);
    }
  }

  static readonly CANONICAL_AMAPAENSE_CLUBS = [
    { externalId: 2224, name: 'Trem Desportivo Clube', logo: 'https://media.api-sports.io/football/teams/2224.png' },
    { externalId: 7785, name: 'Santos Futebol Clube do Amapá', logo: 'https://media.api-sports.io/football/teams/7785.png' },
    { externalId: 10858, name: 'Oratório Recreativo Clube', logo: 'https://media.api-sports.io/football/teams/10858.png' },
    { externalId: 10861, name: 'Independente Esporte Clube', logo: 'https://media.api-sports.io/football/teams/10861.png' },
    { externalId: 7848, name: 'Ypiranga Clube', logo: 'https://media.api-sports.io/football/teams/7848.png' },
    { externalId: 270734, name: 'Portuguesa de Desporto do Amapá', logo: 'https://media.api-sports.io/football/teams/270734.png' },
    { externalId: 78216, name: 'Rio Norte Futebol Clube', logo: 'https://media.api-sports.io/football/teams/78216.png' },
    { externalId: 15622, name: 'SER São José', logo: 'https://media.api-sports.io/football/teams/15622.png' },
  ];

  static readonly CANONICAL_AMAPAENSE_SQUADS: Record<number, any[]> = {
    // 2224 - Trem Desportivo Clube
    2224: [
      { id: 222401, name: 'Vitor Hugo', number: 1, position: 'Goalkeeper', age: 31, photo: 'https://cdn-img.staticzz.com/img/jogadores/31/349831_med__20260301120000.png' },
      { id: 222402, name: 'Redson', number: 12, position: 'Goalkeeper', age: 26, photo: '' },
      { id: 222403, name: 'Felipe Macapá', number: 3, position: 'Defender', age: 28, photo: '' },
      { id: 222404, name: 'Daniel Silva', number: 4, position: 'Defender', age: 26, photo: '' },
      { id: 222405, name: 'Igor', number: 2, position: 'Defender', age: 25, photo: '' },
      { id: 222406, name: 'Alexandre', number: 6, position: 'Defender', age: 27, photo: '' },
      { id: 222407, name: 'Rubens Lucas', number: 8, position: 'Midfielder', age: 27, photo: '' },
      { id: 222408, name: 'Silvio', number: 10, position: 'Midfielder', age: 29, photo: '' },
      { id: 222409, name: 'Levi', number: 5, position: 'Midfielder', age: 28, photo: '' },
      { id: 222410, name: 'Eduardo', number: 15, position: 'Midfielder', age: 24, photo: '' },
      { id: 222411, name: 'Aleilson', number: 9, position: 'Attacker', age: 38, photo: 'https://cdn-img.staticzz.com/img/jogadores/45/14545_med__20260215100000.png' },
      { id: 222412, name: 'Kesley', number: 7, position: 'Attacker', age: 25, photo: '' },
      { id: 222413, name: 'Dudu', number: 11, position: 'Attacker', age: 23, photo: '' },
      { id: 222414, name: 'Neto', number: 17, position: 'Attacker', age: 26, photo: '' },
    ],

    // 7785 - Santos Futebol Clube do Amapá
    7785: [
      { id: 778501, name: 'Matheus Carioca', number: 1, position: 'Goalkeeper', age: 27, photo: '' },
      { id: 778502, name: 'Paulo', number: 12, position: 'Goalkeeper', age: 24, photo: '' },
      { id: 778503, name: 'Batata', number: 2, position: 'Defender', age: 29, photo: '' },
      { id: 778504, name: 'Preto', number: 3, position: 'Defender', age: 30, photo: '' },
      { id: 778505, name: 'Guilherme', number: 4, position: 'Defender', age: 25, photo: '' },
      { id: 778506, name: 'Lucas Santana', number: 6, position: 'Defender', age: 26, photo: '' },
      { id: 778507, name: 'Dudu', number: 7, position: 'Midfielder', age: 24, photo: '' },
      { id: 778508, name: 'Bruninho', number: 8, position: 'Midfielder', age: 28, photo: '' },
      { id: 778509, name: 'Fabinho', number: 10, position: 'Midfielder', age: 27, photo: '' },
      { id: 778510, name: 'Luciano', number: 11, position: 'Attacker', age: 26, photo: '' },
      { id: 778511, name: 'Rômulo', number: 9, position: 'Attacker', age: 29, photo: '' },
      { id: 778512, name: 'Aldair', number: 18, position: 'Attacker', age: 25, photo: '' },
    ],

    // 10858 - Oratório Recreativo Clube
    10858: [
      { id: 1085801, name: 'Lucas Bento', number: 1, position: 'Goalkeeper', age: 25, photo: '' },
      { id: 1085802, name: 'Pato', number: 12, position: 'Goalkeeper', age: 23, photo: '' },
      { id: 1085803, name: 'Dedé', number: 3, position: 'Defender', age: 29, photo: '' },
      { id: 1085804, name: 'Marlon', number: 4, position: 'Defender', age: 26, photo: '' },
      { id: 1085805, name: 'Davy', number: 2, position: 'Defender', age: 24, photo: '' },
      { id: 1085806, name: 'Tarta', number: 10, position: 'Midfielder', age: 30, photo: '' },
      { id: 1085807, name: 'Renatinho', number: 8, position: 'Midfielder', age: 26, photo: '' },
      { id: 1085808, name: 'Gabriel', number: 5, position: 'Midfielder', age: 25, photo: '' },
      { id: 1085809, name: 'Abuda', number: 9, position: 'Attacker', age: 28, photo: '' },
      { id: 1085810, name: 'Vinícius', number: 7, position: 'Attacker', age: 24, photo: '' },
      { id: 1085811, name: 'Luan', number: 11, position: 'Attacker', age: 22, photo: '' },
    ],

    // 10861 - Independente Esporte Clube
    10861: [
      { id: 1086101, name: 'Wanderson', number: 1, position: 'Goalkeeper', age: 26, photo: '' },
      { id: 1086102, name: 'Thiago', number: 12, position: 'Goalkeeper', age: 23, photo: '' },
      { id: 1086103, name: 'Kaio', number: 5, position: 'Defender', age: 24, photo: '' },
      { id: 1086104, name: 'Marcão', number: 3, position: 'Defender', age: 28, photo: '' },
      { id: 1086105, name: 'Yuri', number: 4, position: 'Defender', age: 25, photo: '' },
      { id: 1086106, name: 'Breno', number: 8, position: 'Midfielder', age: 27, photo: '' },
      { id: 1086107, name: 'Patrick', number: 10, position: 'Midfielder', age: 26, photo: '' },
      { id: 1086108, name: 'Marquinhos', number: 7, position: 'Attacker', age: 25, photo: '' },
      { id: 1086109, name: 'Rafael', number: 9, position: 'Attacker', age: 28, photo: '' },
      { id: 1086110, name: 'Matheus', number: 11, position: 'Attacker', age: 22, photo: '' },
    ],

    // 7848 - Ypiranga Clube
    7848: [
      { id: 784801, name: 'Rafael', number: 12, position: 'Goalkeeper', age: 26, photo: '' },
      { id: 784802, name: 'Marcos', number: 1, position: 'Goalkeeper', age: 24, photo: '' },
      { id: 784803, name: 'Guilherme', number: 4, position: 'Defender', age: 23, photo: '' },
      { id: 784804, name: 'Robson', number: 3, position: 'Defender', age: 29, photo: '' },
      { id: 784805, name: 'Pedrão', number: 2, position: 'Defender', age: 27, photo: '' },
      { id: 784806, name: 'Caio', number: 8, position: 'Midfielder', age: 25, photo: '' },
      { id: 784807, name: 'Juninho', number: 10, position: 'Midfielder', age: 27, photo: '' },
      { id: 784808, name: 'Tony Love', number: 9, position: 'Attacker', age: 32, photo: '' },
      { id: 784809, name: 'Danilinho', number: 7, position: 'Attacker', age: 26, photo: '' },
      { id: 784810, name: 'Felipe', number: 11, position: 'Attacker', age: 23, photo: '' },
    ],

    // 270734 - Portuguesa de Desporto do Amapá
    270734: [
      { id: 27073401, name: 'Diego', number: 1, position: 'Goalkeeper', age: 24, photo: '' },
      { id: 27073402, name: 'Arthur', number: 12, position: 'Goalkeeper', age: 22, photo: '' },
      { id: 27073403, name: 'Willian', number: 3, position: 'Defender', age: 27, photo: '' },
      { id: 27073404, name: 'Renato', number: 4, position: 'Defender', age: 26, photo: '' },
      { id: 27073405, name: 'Paulinho', number: 8, position: 'Midfielder', age: 25, photo: '' },
      { id: 27073406, name: 'Gustavo', number: 10, position: 'Midfielder', age: 26, photo: '' },
      { id: 27073407, name: 'Luan', number: 11, position: 'Attacker', age: 22, photo: '' },
      { id: 27073408, name: 'Fabrício', number: 9, position: 'Attacker', age: 28, photo: '' },
      { id: 27073409, name: 'Igor Santos', number: 7, position: 'Attacker', age: 24, photo: '' },
    ],

    // 78216 - Rio Norte Futebol Clube
    78216: [
      { id: 7821601, name: 'Gabriel', number: 1, position: 'Goalkeeper', age: 23, photo: '' },
      { id: 7821602, name: 'Lucas', number: 12, position: 'Goalkeeper', age: 21, photo: '' },
      { id: 7821603, name: 'Everton', number: 3, position: 'Defender', age: 27, photo: '' },
      { id: 7821604, name: 'Rodolfo', number: 4, position: 'Defender', age: 25, photo: '' },
      { id: 7821605, name: 'Alan', number: 2, position: 'Defender', age: 24, photo: '' },
      { id: 7821606, name: 'Marcio', number: 8, position: 'Midfielder', age: 26, photo: '' },
      { id: 7821607, name: 'Wendel', number: 10, position: 'Midfielder', age: 25, photo: '' },
      { id: 7821608, name: 'Ronaldo', number: 9, position: 'Attacker', age: 26, photo: '' },
      { id: 7821609, name: 'Tiago', number: 7, position: 'Attacker', age: 23, photo: '' },
      { id: 7821610, name: 'Cléber', number: 11, position: 'Attacker', age: 24, photo: '' },
    ],

    // 15622 - SER São José
    15622: [
      { id: 1562201, name: 'Bruno', number: 1, position: 'Goalkeeper', age: 28, photo: '' },
      { id: 1562202, name: 'Samuel', number: 12, position: 'Goalkeeper', age: 24, photo: '' },
      { id: 1562203, name: 'Emerson', number: 3, position: 'Defender', age: 29, photo: '' },
      { id: 1562204, name: 'Wallace', number: 4, position: 'Defender', age: 26, photo: '' },
      { id: 1562205, name: 'Leandro', number: 2, position: 'Defender', age: 27, photo: '' },
      { id: 1562206, name: 'Rodrigo', number: 10, position: 'Midfielder', age: 29, photo: '' },
      { id: 1562207, name: 'Danilo', number: 8, position: 'Midfielder', age: 26, photo: '' },
      { id: 1562208, name: 'Jean', number: 9, position: 'Attacker', age: 27, photo: '' },
      { id: 1562209, name: 'Wesley', number: 7, position: 'Attacker', age: 25, photo: '' },
      { id: 1562210, name: 'Marcelinho', number: 11, position: 'Attacker', age: 23, photo: '' },
    ],
  };
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
    await this.ensureTeamSquadTable();
    const league = await this.prisma.league.findUnique({
      where: { externalId: leagueExternalId },
    });

    let standings: any[] = [];
    if (league) {
      standings = await this.prisma.standing.findMany({
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
    }

    let teams = standings.map((s) => s.team);

    // Fallback: se standings ainda não estiver populado, busca times pelas fixtures
    if (teams.length === 0 && league) {
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

    // Fallback garantido para Amapaense (ID 521): assegura a presença dos 8 clubes canônicos
    if (leagueExternalId === 521) {
      const existingExtIds = new Set(teams.map((t) => t.externalId));
      for (const ct of CompetitionsService.CANONICAL_AMAPAENSE_CLUBS) {
        if (!existingExtIds.has(ct.externalId)) {
          let dbTeam: any = null;
          try {
            dbTeam = await this.prisma.team.findUnique({
              where: { externalId: ct.externalId },
            });
          } catch (_) {}
          if (dbTeam) {
            teams.push(dbTeam);
          } else {
            teams.push({
              id: `canonical-${ct.externalId}`,
              externalId: ct.externalId,
              name: ct.name,
              logo: ct.logo,
            });
          }
        }
      }
    }

    if (!league && leagueExternalId !== 521) return [];

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
      let squadList: any[] = [];

      // 1. Verifica cache em memória (edições e inserções recentes)
      if (CompetitionsService.memorySquads.has(team.externalId)) {
        squadList = CompetitionsService.memorySquads.get(team.externalId)!;
      }

      // 2. Busca no banco de dados com try/catch isolado (segurança contra tabela inexistente)
      if (squadList.length === 0) {
        try {
          const squadRecord = await (this.prisma as any).teamSquad?.findUnique({
            where: { teamExternalId: team.externalId },
          });
          if (squadRecord?.squadJson) {
            const parsed = JSON.parse(squadRecord.squadJson);
            if (Array.isArray(parsed) && parsed.length > 0) {
              squadList = parsed;
            }
          }
        } catch (_) {}
      }

      // 3. Se for Amapaense (521) e elenco estiver vazio, usa os atletas canônicos
      if (squadList.length === 0 && leagueExternalId === 521) {
        const canonical = CompetitionsService.CANONICAL_AMAPAENSE_SQUADS[team.externalId];
        if (canonical && canonical.length > 0) {
          squadList = [...canonical];
          try {
            await (this.prisma as any).teamSquad?.upsert({
              where: { teamExternalId: team.externalId },
              update: { squadJson: JSON.stringify(squadList) },
              create: { teamExternalId: team.externalId, squadJson: JSON.stringify(squadList) },
            });
          } catch (_) {}
        }
      }

      // 4. Se ainda estiver vazio (outras ligas), busca via API-Football
      if (squadList.length === 0) {
        try {
          const raw = await this.apiFootball.getSquads(team.externalId);
          if (raw && raw.length > 0 && Array.isArray(raw[0]?.players) && raw[0].players.length > 0) {
            squadList = raw[0].players.map((p: any) => ({
              id: p.id,
              name: p.name,
              age: p.age,
              number: p.number ?? null,
              position: p.position || 'Player',
              photo: p.photo || null,
            }));
            try {
              await (this.prisma as any).teamSquad?.upsert({
                where: { teamExternalId: team.externalId },
                update: { squadJson: JSON.stringify(squadList) },
                create: { teamExternalId: team.externalId, squadJson: JSON.stringify(squadList) },
              });
            } catch (_) {}
          }
        } catch (_) {}
      }

      // 5. Atualiza o cache em memória
      if (squadList.length > 0) {
        CompetitionsService.memorySquads.set(team.externalId, squadList);
      }

      // 6. Popula allPlayers
      for (const p of squadList) {
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

    return allPlayers;
  }

  private getInitialSquad(teamExternalId: number): any[] {
    if (CompetitionsService.memorySquads.has(teamExternalId)) {
      return [...CompetitionsService.memorySquads.get(teamExternalId)!];
    }
    const defaultSquad = CompetitionsService.CANONICAL_AMAPAENSE_SQUADS[teamExternalId];
    if (defaultSquad) {
      return [...defaultSquad];
    }
    return [];
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
    await this.ensureTeamSquadTable();
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

    let squad: any[] = this.getInitialSquad(teamExternalId);
    try {
      const record = await (this.prisma as any).teamSquad?.findUnique({
        where: { teamExternalId },
      });
      if (record?.squadJson) {
        const parsed = JSON.parse(record.squadJson);
        if (Array.isArray(parsed) && parsed.length > 0) squad = parsed;
      }
    } catch (_) {}

    squad.push(newPlayer);
    CompetitionsService.memorySquads.set(teamExternalId, squad);

    try {
      await (this.prisma as any).teamSquad?.upsert({
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
    await this.ensureTeamSquadTable();
    let updatedPlayer: any = null;

    if (data.teamExternalId) {
      const tId = Number(data.teamExternalId);
      let squad = this.getInitialSquad(tId);
      try {
        const squadRecord = await (this.prisma as any).teamSquad?.findUnique({
          where: { teamExternalId: tId },
        });
        if (squadRecord?.squadJson) {
          const parsed = JSON.parse(squadRecord.squadJson);
          if (Array.isArray(parsed) && parsed.length > 0) squad = parsed;
        }
      } catch (_) {}

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
        CompetitionsService.memorySquads.set(tId, squad);
        try {
          await (this.prisma as any).teamSquad?.update({
            where: { teamExternalId: tId },
            data: { squadJson: JSON.stringify(squad) },
          });
        } catch (_) {}
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
    await this.ensureTeamSquadTable();
    let deleted = false;
    if (teamExternalId) {
      const tId = Number(teamExternalId);
      let squad = this.getInitialSquad(tId);
      try {
        const squadRecord = await (this.prisma as any).teamSquad?.findUnique({
          where: { teamExternalId: tId },
        });
        if (squadRecord?.squadJson) {
          const parsed = JSON.parse(squadRecord.squadJson);
          if (Array.isArray(parsed) && parsed.length > 0) squad = parsed;
        }
      } catch (_) {}

      const initialLen = squad.length;
      const filtered = squad.filter((p: any) => p.id !== playerId);
      if (filtered.length < initialLen) {
        deleted = true;
        CompetitionsService.memorySquads.set(tId, filtered);
        try {
          await (this.prisma as any).teamSquad?.update({
            where: { teamExternalId: tId },
            data: { squadJson: JSON.stringify(filtered) },
          });
        } catch (_) {}
      }
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
    await this.ensureTeamSquadTable();
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

    // 2. Atualizar no TeamSquad e no cache em memória do clube
    if (data.teamExternalId) {
      const tId = Number(data.teamExternalId);
      let squad = this.getInitialSquad(tId);
      try {
        const squadRecord = await (this.prisma as any).teamSquad?.findUnique({
          where: { teamExternalId: tId },
        });
        if (squadRecord?.squadJson) {
          const parsed = JSON.parse(squadRecord.squadJson);
          if (Array.isArray(parsed) && parsed.length > 0) squad = parsed;
        }
      } catch (_) {}

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
        CompetitionsService.memorySquads.set(tId, squad);
        try {
          await (this.prisma as any).teamSquad?.update({
            where: { teamExternalId: tId },
            data: { squadJson: JSON.stringify(squad) },
          });
        } catch (_) {}
      }
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
