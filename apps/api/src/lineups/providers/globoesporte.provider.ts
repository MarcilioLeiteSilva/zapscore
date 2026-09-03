import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { ILineupProvider, NormalizedLineupResult, NormalizedPlayer } from '../interfaces/lineup-provider.interface';

@Injectable()
export class GloboesporteProvider implements ILineupProvider {
  readonly name = 'globoesporte' as const;
  private readonly logger = new Logger(GloboesporteProvider.name);

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
      .replace(/\b(fc|ec|sc|cr|se|afc|cf|ac|clube|esporte|futebol|de|da|do)\b/g, '')
      .replace(/[^a-z0-9]/g, '')
      .trim();
  }

  /**
   * Consulta a grade de partidas do dia
   */
  private async getGamesForDate(date: Date): Promise<any[]> {
    const dateStr = date.toISOString().split('T')[0];
    const cached = this.gamesCache.get(dateStr);
    const now = Date.now();

    if (cached && now - cached.timestamp < 15 * 60 * 1000) {
      return cached.games;
    }

    try {
      this.logger.log(`[GE/365Fallback] Consultando jogos do dia para contingência regional (${dateStr})...`);
      // Endpoint público de jogos do dia em tempo real (fuso de Brasília)
      const url = `https://webws.365scores.com/web/games/current/?appTypeId=5&langId=31&timezoneName=America/Sao_Paulo&userCountryId=21`;
      const response = await axios.get(url, { headers: this.headers, timeout: 8000 });

      const games = response.data?.games || [];
      this.gamesCache.set(dateStr, { timestamp: now, games });
      return games;
    } catch (err: any) {
      this.logger.warn(`[GE/365Fallback] Falha ao consultar jogos: ${err.message}`);
      return cached ? cached.games : [];
    }
  }

  /**
   * Pareia o ID do jogo regional
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
        this.logger.log(`[GE/365Fallback] Pareamento encontrado: ${homeTeamName} x ${awayTeamName} ➔ ID: ${gameId}`);
        this.fixtureToIdMap.set(externalFixtureId, gameId);
        return gameId;
      }
    }

    return null;
  }

  /**
   * Consulta e normaliza escalações
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
      const lineupsData = gameData?.lineups;

      if (!lineupsData) return null;

      const homeStarters: NormalizedPlayer[] = [];
      const homeSubs: NormalizedPlayer[] = [];
      const awayStarters: NormalizedPlayer[] = [];
      const awaySubs: NormalizedPlayer[] = [];

      // Membros do mandante
      const homeMembers = lineupsData.homeCompetitor?.members || [];
      for (const m of homeMembers) {
        const p: NormalizedPlayer = {
          player: m.name || m.shortName,
          number: m.jerseyNumber ? Number(m.jerseyNumber) : undefined,
          pos: m.positionName || undefined,
          grid: m.formationOrder ? String(m.formationOrder) : undefined,
          isStart: m.status === 1, // 1 = Starter no schema 365/GE
          playerPhoto: m.id ? `https://imagecache.365scores.com/images/athletes/w_120,h_120,c_limit/${m.id}.png` : undefined,
          externalPlayerId: m.id ? Number(m.id) : undefined,
        };
        if (p.isStart) homeStarters.push(p);
        else homeSubs.push(p);
      }

      // Membros do visitante
      const awayMembers = lineupsData.awayCompetitor?.members || [];
      for (const m of awayMembers) {
        const p: NormalizedPlayer = {
          player: m.name || m.shortName,
          number: m.jerseyNumber ? Number(m.jerseyNumber) : undefined,
          pos: m.positionName || undefined,
          grid: m.formationOrder ? String(m.formationOrder) : undefined,
          isStart: m.status === 1,
          playerPhoto: m.id ? `https://imagecache.365scores.com/images/athletes/w_120,h_120,c_limit/${m.id}.png` : undefined,
          externalPlayerId: m.id ? Number(m.id) : undefined,
        };
        if (p.isStart) awayStarters.push(p);
        else awaySubs.push(p);
      }

      if (homeStarters.length < 11 || awayStarters.length < 11) {
        return null;
      }

      this.logger.log(
        `[GE/365Fallback] ✅ Escalações confirmadas obtidas para Jogo ${gameId} (${params.homeTeamName} ${homeStarters.length}x${awayStarters.length} ${params.awayTeamName})`,
      );

      return {
        success: true,
        confirmed: true,
        source: 'globoesporte',
        formation: {
          home: lineupsData.homeCompetitor?.formation,
          away: lineupsData.awayCompetitor?.formation,
        },
        homeTeam: {
          starters: homeStarters,
          substitutes: homeSubs,
        },
        awayTeam: {
          starters: awayStarters,
          substitutes: awaySubs,
        },
      };
    } catch (err: any) {
      if (err.response?.status !== 404) {
        this.logger.warn(`[GE/365Fallback] Falha ao consultar lineup da fixture ${params.externalFixtureId}: ${err.message}`);
      }
      return null;
    }
  }
}
