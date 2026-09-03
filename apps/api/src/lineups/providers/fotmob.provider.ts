import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { ILineupProvider, NormalizedLineupResult, NormalizedPlayer } from '../interfaces/lineup-provider.interface';

@Injectable()
export class FotmobProvider implements ILineupProvider {
  readonly name = 'fotmob' as const;
  private readonly logger = new Logger(FotmobProvider.name);

  private readonly headers = {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
    Accept: 'application/json, text/plain, */*',
    Referer: 'https://www.fotmob.com/',
    'Cache-Control': 'no-cache',
  };

  private readonly fixtureToFotmobIdMap = new Map<number, number>();
  private readonly dateMatchesCache = new Map<string, { timestamp: number; matches: any[] }>();

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
   * Obtém a lista de partidas do dia no FotMob
   */
  private async getFotmobMatchesForDate(date: Date): Promise<any[]> {
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    const dateStr = `${year}${month}${day}`;

    const cached = this.dateMatchesCache.get(dateStr);
    const now = Date.now();

    if (cached && now - cached.timestamp < 15 * 60 * 1000) {
      return cached.matches;
    }

    try {
      this.logger.log(`[FotMob] Buscando partidas para a data ${dateStr}...`);
      const url = `https://www.fotmob.com/api/matches?date=${dateStr}&timezone=America%2FSao_Paulo`;
      const response = await axios.get(url, { headers: this.headers, timeout: 10000 });

      const matches: any[] = [];
      const leagues = response.data?.leagues || [];
      for (const league of leagues) {
        if (Array.isArray(league.matches)) {
          matches.push(...league.matches);
        }
      }

      this.dateMatchesCache.set(dateStr, { timestamp: now, matches });
      return matches;
    } catch (err: any) {
      this.logger.warn(`[FotMob] Falha ao consultar partidas do dia: ${err.message}`);
      return cached ? cached.matches : [];
    }
  }

  /**
   * Pareamento do ID do FotMob
   */
  private async resolveFotmobMatchId(
    externalFixtureId: number,
    homeTeamName: string,
    awayTeamName: string,
    matchDate: Date,
  ): Promise<number | null> {
    if (this.fixtureToFotmobIdMap.has(externalFixtureId)) {
      return this.fixtureToFotmobIdMap.get(externalFixtureId)!;
    }

    const matches = await this.getFotmobMatchesForDate(matchDate);
    if (!matches || matches.length === 0) return null;

    const normHome = this.normalizeTeamName(homeTeamName);
    const normAway = this.normalizeTeamName(awayTeamName);

    for (const m of matches) {
      const mHome = this.normalizeTeamName(m.home?.name || '');
      const mAway = this.normalizeTeamName(m.away?.name || '');

      const isHomeMatch = normHome.includes(mHome) || mHome.includes(normHome);
      const isAwayMatch = normAway.includes(mAway) || mAway.includes(normAway);

      if (isHomeMatch && isAwayMatch) {
        const fotmobId = Number(m.id);
        this.logger.log(
          `[FotMob] Pareamento encontrado: ${homeTeamName} x ${awayTeamName} ➔ FotMob Match ID: ${fotmobId}`,
        );
        this.fixtureToFotmobIdMap.set(externalFixtureId, fotmobId);
        return fotmobId;
      }
    }

    return null;
  }

  /**
   * Normaliza os jogadores do FotMob
   */
  private parsePlayers(teamLineup: any): { starters: NormalizedPlayer[]; substitutes: NormalizedPlayer[] } {
    const starters: NormalizedPlayer[] = [];
    const substitutes: NormalizedPlayer[] = [];

    if (!teamLineup) return { starters, substitutes };

    // Starters
    const startersList = teamLineup.starters || teamLineup.players || [];
    for (const p of startersList) {
      const name = p.name?.fullName || p.name || p.usingFullname;
      if (!name) continue;

      starters.push({
        player: name,
        number: p.shirtNumber ? Number(p.shirtNumber) : undefined,
        pos: p.positionString || p.role || undefined,
        grid: undefined,
        isStart: true,
        playerPhoto: p.id ? `https://images.fotmob.com/image_resources/playerimages/${p.id}.png` : undefined,
        externalPlayerId: p.id ? Number(p.id) : undefined,
      });
    }

    // Subs
    const subsList = teamLineup.subs || teamLineup.bench || [];
    for (const p of subsList) {
      const name = p.name?.fullName || p.name || p.usingFullname;
      if (!name) continue;

      substitutes.push({
        player: name,
        number: p.shirtNumber ? Number(p.shirtNumber) : undefined,
        pos: p.positionString || p.role || undefined,
        grid: undefined,
        isStart: false,
        playerPhoto: p.id ? `https://images.fotmob.com/image_resources/playerimages/${p.id}.png` : undefined,
        externalPlayerId: p.id ? Number(p.id) : undefined,
      });
    }

    return { starters, substitutes };
  }

  /**
   * Consulta e normaliza escalações do FotMob
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
      const matchId = await this.resolveFotmobMatchId(
        params.externalFixtureId,
        params.homeTeamName,
        params.awayTeamName,
        params.matchDate,
      );

      if (!matchId) return null;

      const url = `https://www.fotmob.com/api/matchDetails?matchId=${matchId}`;
      const response = await axios.get(url, { headers: this.headers, timeout: 8000 });

      const lineupData = response.data?.content?.lineup;
      if (!lineupData) return null;

      let homeParsed = { starters: [] as NormalizedPlayer[], substitutes: [] as NormalizedPlayer[] };
      let awayParsed = { starters: [] as NormalizedPlayer[], substitutes: [] as NormalizedPlayer[] };
      let homeFormation: string | undefined;
      let awayFormation: string | undefined;

      // Estrutura 1: lineup.lineup (array com 2 times)
      if (Array.isArray(lineupData.lineup) && lineupData.lineup.length >= 2) {
        homeParsed = this.parsePlayers(lineupData.lineup[0]);
        awayParsed = this.parsePlayers(lineupData.lineup[1]);
        homeFormation = lineupData.lineup[0]?.formation;
        awayFormation = lineupData.lineup[1]?.formation;
      } else if (lineupData.homeTeam && lineupData.awayTeam) {
        // Estrutura 2: lineup.homeTeam e lineup.awayTeam
        homeParsed = this.parsePlayers(lineupData.homeTeam);
        awayParsed = this.parsePlayers(lineupData.awayTeam);
      }

      if (homeParsed.starters.length < 11 || awayParsed.starters.length < 11) {
        return null;
      }

      this.logger.log(
        `[FotMob] ✅ Escalações confirmadas obtidas para Match ${matchId} (${params.homeTeamName} ${homeParsed.starters.length}x${awayParsed.starters.length} ${params.awayTeamName})`,
      );

      return {
        success: true,
        confirmed: true,
        source: 'fotmob',
        formation: {
          home: homeFormation,
          away: awayFormation,
        },
        homeTeam: homeParsed,
        awayTeam: awayParsed,
      };
    } catch (err: any) {
      if (err.response?.status !== 404) {
        this.logger.warn(`[FotMob] Falha ao consultar lineup da fixture ${params.externalFixtureId}: ${err.message}`);
      }
      return null;
    }
  }
}
