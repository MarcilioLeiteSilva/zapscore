import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { ILineupProvider, NormalizedLineupResult, NormalizedPlayer } from '../interfaces/lineup-provider.interface';
import { resolveMatchDates } from '../utils/date-resolver.util';

@Injectable()
export class LivescoreProvider implements ILineupProvider {
  readonly name = 'livescore' as const;
  private readonly logger = new Logger(LivescoreProvider.name);

  private readonly headers = {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
    Accept: 'application/json, text/plain, */*',
    'Cache-Control': 'no-cache',
  };

  private readonly fixtureToLiveScoreMap = new Map<number, string>();
  private readonly dateMatchesCache = new Map<string, { timestamp: number; events: any[] }>();

  /**
   * Normalização de strings para fuzzy matching de clubes
   */
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
   * Mapeamento de posição para formato conciso G, D, M, F
   */
  private mapPosition(pon?: string, posNum?: number): string | undefined {
    if (posNum === 1) return 'G';
    if (posNum === 2) return 'D';
    if (posNum === 3) return 'M';
    if (posNum === 4) return 'F';

    if (pon) {
      const p = pon.toLowerCase();
      if (p.includes('goal') || p.includes('goleiro')) return 'G';
      if (p.includes('defen') || p.includes('back')) return 'D';
      if (p.includes('mid')) return 'M';
      if (p.includes('forw') || p.includes('striker') || p.includes('wing') || p.includes('attack')) return 'F';
    }
    return undefined;
  }

  /**
   * Obtém a lista de eventos agendados da data no LiveScore
   * Consulta datas canônicas (UTC e BRT) para garantir cobertura 100% resiliente a fusos.
   */
  private async getEventsForDate(date: Date): Promise<any[]> {
    const dates = resolveMatchDates(date);
    const now = Date.now();
    const allEvents: any[] = [];
    const seenEventIds = new Set<string>();

    for (const dateStr of dates.allDatesCompact) {
      const cached = this.dateMatchesCache.get(dateStr);

      if (cached && now - cached.timestamp < 15 * 60 * 1000) {
        for (const ev of cached.events) {
          const eid = String(ev.Eid || ev.eid || '');
          if (!seenEventIds.has(eid)) {
            seenEventIds.add(eid);
            allEvents.push(ev);
          }
        }
        continue;
      }

      try {
        this.logger.log(`[LiveScore] Consultando partidas para a data ${dateStr}...`);
        const url = `https://prod-public-api.livescore.com/v1/api/app/date/soccer/${dateStr}/0`;
        const response = await axios.get(url, { headers: this.headers, timeout: 10000 });

        const dayEvents: any[] = [];
        const stages = response.data?.Stages || [];
        for (const stage of stages) {
          if (Array.isArray(stage.Events)) {
            dayEvents.push(...stage.Events);
          }
        }

        this.dateMatchesCache.set(dateStr, { timestamp: now, events: dayEvents });

        for (const ev of dayEvents) {
          const eid = String(ev.Eid || ev.eid || '');
          if (!seenEventIds.has(eid)) {
            seenEventIds.add(eid);
            allEvents.push(ev);
          }
        }
      } catch (err: any) {
        this.logger.warn(`[LiveScore] Falha ao consultar partidas de ${dateStr}: ${err.message}`);
        if (cached) {
          for (const ev of cached.events) {
            const eid = String(ev.Eid || ev.eid || '');
            if (!seenEventIds.has(eid)) {
              seenEventIds.add(eid);
              allEvents.push(ev);
            }
          }
        }
      }
    }

    return allEvents;
  }

  /**
   * Pareia a partida com o Eid do LiveScore
   */
  private async resolveLiveScoreEvent(
    externalFixtureId: number,
    homeTeamName: string,
    awayTeamName: string,
    matchDate: Date,
  ): Promise<string | null> {
    if (this.fixtureToLiveScoreMap.has(externalFixtureId)) {
      return this.fixtureToLiveScoreMap.get(externalFixtureId)!;
    }

    const events = await this.getEventsForDate(matchDate);
    if (!events || events.length === 0) return null;

    const normHome = this.normalizeTeamName(homeTeamName);
    const normAway = this.normalizeTeamName(awayTeamName);

    for (const ev of events) {
      const evHome = this.normalizeTeamName(ev.T1?.[0]?.Nm || '');
      const evAway = this.normalizeTeamName(ev.T2?.[0]?.Nm || '');

      const isDirectMatch =
        (normHome.includes(evHome) || evHome.includes(normHome)) &&
        (normAway.includes(evAway) || evAway.includes(normAway));

      const isInverseMatch =
        (normHome.includes(evAway) || evAway.includes(normHome)) &&
        (normAway.includes(evHome) || evHome.includes(normAway));

      if (isDirectMatch || isInverseMatch) {
        const eid = String(ev.Eid);
        this.logger.log(`[LiveScore] ✅ Pareamento encontrado: ${homeTeamName} x ${awayTeamName} ➔ EID: ${eid}`);
        this.fixtureToLiveScoreMap.set(externalFixtureId, eid);
        return eid;
      }
    }

    return null;
  }

  /**
   * Converte a lista de jogadores do LiveScore em NormalizedPlayer
   */
  private parsePlayers(players: any[]): { starters: NormalizedPlayer[]; substitutes: NormalizedPlayer[] } {
    const starters: NormalizedPlayer[] = [];
    const substitutes: NormalizedPlayer[] = [];

    if (!Array.isArray(players)) return { starters, substitutes };

    for (const p of players) {
      const name = p.Fn ? `${p.Fn} ${p.Ln}`.trim() : (p.Ln || p.Pnt || 'Jogador');
      const jerseyNumber = p.Snu ? Number(p.Snu) : undefined;
      const pos = this.mapPosition(p.Pon, p.Pos);
      const grid = p.Fp ? String(p.Fp) : undefined;
      const isStart = !!p.Fp; // Jogadores com posição de campo (Fp) são os 11 titulares
      const playerPhoto = p.imageUrl ? `https://static.livescore.com/static/sports/football/players/${p.imageUrl}` : undefined;
      const externalPlayerId = p.Pid ? Number(p.Pid) : undefined;

      const normalized: NormalizedPlayer = {
        player: name,
        number: jerseyNumber,
        pos,
        grid,
        isStart,
        playerPhoto,
        externalPlayerId,
      };

      if (isStart) {
        starters.push(normalized);
      } else {
        substitutes.push(normalized);
      }
    }

    return { starters, substitutes };
  }

  /**
   * Consulta e normaliza escalações do LiveScore
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
      const eid = await this.resolveLiveScoreEvent(
        params.externalFixtureId,
        params.homeTeamName,
        params.awayTeamName,
        params.matchDate,
      );

      if (!eid) return null;

      const url = `https://prod-public-api.livescore.com/v1/api/app/lineups/soccer/${eid}`;
      const response = await axios.get(url, { headers: this.headers, timeout: 8000 });

      const lu = response.data?.Lu;
      if (!Array.isArray(lu) || lu.length < 2) return null;

      const homeParsed = this.parsePlayers(lu[0]?.Ps || []);
      const awayParsed = this.parsePlayers(lu[1]?.Ps || []);

      if (homeParsed.starters.length < 11 || awayParsed.starters.length < 11) {
        return null;
      }

      const homeFormation = Array.isArray(lu[0]?.Fo) ? lu[0].Fo.join('-') : undefined;
      const awayFormation = Array.isArray(lu[1]?.Fo) ? lu[1].Fo.join('-') : undefined;

      this.logger.log(
        `[LiveScore] 🏆 Escalações confirmadas obtidas para ${params.homeTeamName} x ${params.awayTeamName} (${homeParsed.starters.length}x${awayParsed.starters.length} titulares)`,
      );

      return {
        success: true,
        confirmed: true,
        source: 'livescore',
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
        this.logger.warn(`[LiveScore] Falha ao consultar lineup para EID: ${err.message}`);
      }
      return null;
    }
  }
}
