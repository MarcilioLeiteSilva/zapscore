import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { ILineupProvider, NormalizedLineupResult, NormalizedPlayer } from '../interfaces/lineup-provider.interface';
import { resolveMatchDates } from '../utils/date-resolver.util';

@Injectable()
export class GloboesporteProvider implements ILineupProvider {
  readonly name = 'globoesporte' as const;
  private readonly logger = new Logger('365ScoresProvider');

  private readonly headers = {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
    Accept: 'application/json, text/plain, */*',
    'Cache-Control': 'no-cache',
    'Accept-Language': 'pt-BR,pt;q=0.9',
  };

  private readonly fixtureToIdMap = new Map<number, number>();
  private readonly gamesCache = new Map<string, { timestamp: number; games: any[] }>();

  private normalizeTeamName(name: string): string {
    return (name || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/\b(fc|ec|sc|cr|se|afc|cf|ac|clube|esporte|futebol|de|da|do|town|city|united|hotspur)\b/g, '')
      .replace(/[^a-z0-9]/g, '')
      .trim();
  }

  /**
   * Consulta a grade completa de partidas do dia (800+ jogos diários via /allscores/)
   * Utiliza resolução canônica de datas (BRT + UTC) para garantir que partidas noturnas (21h/23h)
   * ou internacionais sejam encontradas independentemente do fuso de agrupamento da fonte.
   */
  private async getGamesForDate(date: Date): Promise<any[]> {
    const dates = resolveMatchDates(date);
    const now = Date.now();
    const allGames: any[] = [];
    const seenGameIds = new Set<string>();

    for (const dateQuery of dates.allDatesFormatted) {
      const cacheKey = dateQuery;
      const cached = this.gamesCache.get(cacheKey);

      if (cached && now - cached.timestamp < 15 * 60 * 1000) {
        for (const g of cached.games) {
          if (!seenGameIds.has(String(g.id))) {
            seenGameIds.add(String(g.id));
            allGames.push(g);
          }
        }
        continue;
      }

      try {
        this.logger.log(`[365Scores] Consultando grade abrangente (${dateQuery})...`);
        const url = `https://webws.365scores.com/web/games/allscores/?appTypeId=5&langId=31&timezoneName=America/Sao_Paulo&userCountryId=21&startDate=${dateQuery}&endDate=${dateQuery}`;
        const response = await axios.get(url, { headers: this.headers, timeout: 10000 });

        let dayGames: any[] = response.data?.games || [];
        if (dayGames.length === 0 && Array.isArray(response.data?.competitions)) {
          for (const comp of response.data.competitions) {
            if (Array.isArray(comp.games)) {
              dayGames.push(...comp.games);
            }
          }
        }

        this.logger.log(`[365Scores] ✅ ${dayGames.length} confrontos carregados para ${dateQuery}`);
        this.gamesCache.set(cacheKey, { timestamp: now, games: dayGames });

        for (const g of dayGames) {
          if (!seenGameIds.has(String(g.id))) {
            seenGameIds.add(String(g.id));
            allGames.push(g);
          }
        }
      } catch (err: any) {
        this.logger.warn(`[365Scores] Falha ao consultar grade para ${dateQuery}: ${err.message}`);
        if (cached) {
          for (const g of cached.games) {
            if (!seenGameIds.has(String(g.id))) {
              seenGameIds.add(String(g.id));
              allGames.push(g);
            }
          }
        }
      }
    }

    return allGames;
  }

  /**
   * Pareia o ID do confronto no 365Scores
   */
  private async resolveGameId(
    externalFixtureId: number,
    homeTeamName: string,
    awayTeamName: string,
    matchDate: Date,
  ): Promise<number | null> {
    if (this.fixtureToIdMap.has(externalFixtureId)) {
      return this.fixtureToIdMap.get(externalFixtureId)!;
    }

    const games = await this.getGamesForDate(matchDate);
    if (!games || games.length === 0) return null;

    const normHome = this.normalizeTeamName(homeTeamName);
    const normAway = this.normalizeTeamName(awayTeamName);

    for (const g of games) {
      const gHome = this.normalizeTeamName(g.homeCompetitor?.name || '');
      const gAway = this.normalizeTeamName(g.awayCompetitor?.name || '');

      const isHomeMatch = normHome.includes(gHome) || gHome.includes(normHome);
      const isAwayMatch = normAway.includes(gAway) || gAway.includes(normAway);

      if (isHomeMatch && isAwayMatch) {
        const gameId = Number(g.id);
        this.logger.log(`[365Scores] ✅ Pareamento encontrado: ${homeTeamName} x ${awayTeamName} ➔ ID: ${gameId}`);
        this.fixtureToIdMap.set(externalFixtureId, gameId);
        return gameId;
      }
    }

    return null;
  }

  private mapPosition(posName?: string): string | undefined {
    if (!posName) return undefined;
    const p = posName.toLowerCase();
    if (p.includes('gol') || p.includes('keep')) return 'G';
    if (p.includes('def') || p.includes('zag') || p.includes('lat') || p.includes('back')) return 'D';
    if (p.includes('mei') || p.includes('vol') || p.includes('mid')) return 'M';
    if (p.includes('ata') || p.includes('pon') || p.includes('cen') || p.includes('forw') || p.includes('strik')) return 'F';
    return undefined;
  }

  /**
   * Converte membros da súmula em atletas normalizados
   */
  private extractTeamLineup(
    lineupMembers: any[],
    membersMetaMap: Map<number, any>,
  ): { starters: NormalizedPlayer[]; substitutes: NormalizedPlayer[] } {
    const starters: NormalizedPlayer[] = [];
    const substitutes: NormalizedPlayer[] = [];

    for (const m of lineupMembers) {
      const meta = membersMetaMap.get(Number(m.id)) || {};
      const playerName = meta.name || meta.shortName || m.name || m.shortName || 'Jogador';
      const jerseyNumber = meta.jerseyNumber !== undefined ? Number(meta.jerseyNumber) : (m.jerseyNumber ? Number(m.jerseyNumber) : undefined);
      const pos = this.mapPosition(m.position?.name || m.positionName || m.formation?.name);
      const isStart = m.status === 1; // 1 = Starting no 365Scores

      const athleteId = meta.athleteId || meta.id || m.athleteId || m.id;
      const externalPlayerId = athleteId ? Number(athleteId) : undefined;

      const normalized: NormalizedPlayer = {
        player: playerName,
        number: jerseyNumber,
        pos,
        grid: undefined, // Será calculado dinamicamente conforme a formação real de cada time
        isStart,
        playerPhoto: undefined, // Enriquecido via base oficial de plantéis TeamSquad
        externalPlayerId,
      };

      if (isStart) starters.push(normalized);
      else if (m.status === 2) substitutes.push(normalized);
    }

    return { starters, substitutes };
  }

  /**
   * Consulta e normaliza escalações completas no 365Scores
   */
  async getLineup(params: {
    homeTeamName: string;
    awayTeamName: string;
    matchDate: Date;
    externalFixtureId: number;
    homeTeamExternalId: number;
    awayTeamExternalId: number;
  }): Promise<NormalizedLineupResult | null> {
    try {
      const gameId = await this.resolveGameId(
        params.externalFixtureId,
        params.homeTeamName,
        params.awayTeamName,
        params.matchDate,
      );

      if (!gameId) return null;

      const url = `https://webws.365scores.com/web/game/?appTypeId=5&langId=31&gameId=${gameId}`;
      const response = await axios.get(url, { headers: this.headers, timeout: 8000 });

      const gameData = response.data?.game;
      if (!gameData) return null;

      // Monta dicionário de atletas gerais para enriquecimento de nomes e números
      const membersMetaMap = new Map<number, any>();
      if (Array.isArray(gameData.members)) {
        for (const meta of gameData.members) {
          if (meta.id) membersMetaMap.set(Number(meta.id), meta);
        }
      }

      // Suporte flexível para estruturas lineups.members e homeCompetitor.lineups.members
      const homeMembers = 
        gameData.homeCompetitor?.lineups?.members || 
        gameData.lineups?.homeCompetitor?.members || 
        [];

      const awayMembers = 
        gameData.awayCompetitor?.lineups?.members || 
        gameData.lineups?.awayCompetitor?.members || 
        [];

      if (homeMembers.length === 0 || awayMembers.length === 0) {
        return null;
      }

      const homeParsed = this.extractTeamLineup(homeMembers, membersMetaMap);
      const awayParsed = this.extractTeamLineup(awayMembers, membersMetaMap);

      if (homeParsed.starters.length < 11 || awayParsed.starters.length < 11) {
        return null;
      }

      const homeFormation = gameData.homeCompetitor?.lineups?.formation || gameData.lineups?.homeCompetitor?.formation;
      const awayFormation = gameData.awayCompetitor?.lineups?.formation || gameData.lineups?.awayCompetitor?.formation;

      this.logger.log(
        `[365Scores] 🏆 Escalações confirmadas obtidas para Jogo ${gameId} (${params.homeTeamName} ${homeParsed.starters.length}x${awayParsed.starters.length} ${params.awayTeamName})`,
      );

      return {
        success: true,
        confirmed: true,
        source: 'globoesporte',
        formation: {
          home: homeFormation,
          away: awayFormation,
        },
        homeTeam: {
          starters: homeParsed.starters,
          substitutes: homeParsed.substitutes,
        },
        awayTeam: {
          starters: awayParsed.starters,
          substitutes: awayParsed.substitutes,
        },
      };
    } catch (err: any) {
      if (err.response?.status !== 404) {
        this.logger.warn(`[365Scores] Falha ao consultar lineup da fixture ${params.externalFixtureId}: ${err.message}`);
      }
      return null;
    }
  }
}
