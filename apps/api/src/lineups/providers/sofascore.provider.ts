import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { ILineupProvider, NormalizedLineupResult, NormalizedPlayer } from '../interfaces/lineup-provider.interface';

@Injectable()
export class SofascoreProvider implements ILineupProvider {
  readonly name = 'sofascore' as const;
  private readonly logger = new Logger(SofascoreProvider.name);

  private readonly headers = {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
    Accept: 'application/json, text/plain, */*',
    Referer: 'https://www.sofascore.com/',
    Origin: 'https://www.sofascore.com',
    'Cache-Control': 'no-cache',
    'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
  };

  // Cache em memória para evitar requisições repetidas
  private readonly fixtureToSofaEventMap = new Map<number, number>();
  private readonly scheduledEventsCache = new Map<string, { timestamp: number; events: any[] }>();

  /**
   * Normalização de strings para fuzzy matching de clubes
   */
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
   * Busca a lista de eventos do dia no Sofascore com cache de 15 minutos
   */
  private async getScheduledEventsForDate(date: Date): Promise<any[]> {
    const dateStr = date.toISOString().split('T')[0];
    const cached = this.scheduledEventsCache.get(dateStr);
    const now = Date.now();

    if (cached && now - cached.timestamp < 15 * 60 * 1000) {
      return cached.events;
    }

    try {
      this.logger.log(`[Sofascore] Buscando eventos agendados para a data ${dateStr}...`);
      const url = `https://api.sofascore.com/api/v1/sport/football/scheduled-events/${dateStr}`;
      const response = await axios.get(url, {
        headers: this.headers,
        timeout: 10000,
      });

      const events = response.data?.events || [];
      this.scheduledEventsCache.set(dateStr, { timestamp: now, events });
      return events;
    } catch (err: any) {
      this.logger.warn(`[Sofascore] Falha ao consultar scheduled-events para ${dateStr}: ${err.message}`);
      return cached ? cached.events : [];
    }
  }

  /**
   * Identifica o ID do evento do Sofascore correspondente à partida
   */
  private async resolveSofaEventId(
    externalFixtureId: number,
    homeTeamName: string,
    awayTeamName: string,
    matchDate: Date,
  ): Promise<number | null> {
    if (this.fixtureToSofaEventMap.has(externalFixtureId)) {
      return this.fixtureToSofaEventMap.get(externalFixtureId)!;
    }

    const events = await this.getScheduledEventsForDate(matchDate);
    if (!events || events.length === 0) return null;

    const normHome = this.normalizeTeamName(homeTeamName);
    const normAway = this.normalizeTeamName(awayTeamName);
    const matchTimeMs = new Date(matchDate).getTime();

    for (const ev of events) {
      const evHome = this.normalizeTeamName(ev.homeTeam?.name || '');
      const evAway = this.normalizeTeamName(ev.awayTeam?.name || '');
      const evTimeMs = (ev.startTimestamp || 0) * 1000;

      // Tolerância de até 90 minutos para fusos ou pequenas alterações de tabela
      const timeDiff = Math.abs(matchTimeMs - evTimeMs);
      const isTimeClose = timeDiff <= 90 * 60 * 1000;

      const isHomeMatch = normHome.includes(evHome) || evHome.includes(normHome);
      const isAwayMatch = normAway.includes(evAway) || evAway.includes(normAway);

      if (isTimeClose && isHomeMatch && isAwayMatch) {
        this.logger.log(
          `[Sofascore] Pareamento encontrado: ${homeTeamName} x ${awayTeamName} ➔ Sofascore Event ID: ${ev.id}`,
        );
        this.fixtureToSofaEventMap.set(externalFixtureId, ev.id);
        return ev.id;
      }
    }

    return null;
  }

  /**
   * Mapeia lista de jogadores do Sofascore para o formato padronizado do ZapScore
   */
  private mapPlayers(players: any[]): { starters: NormalizedPlayer[]; substitutes: NormalizedPlayer[] } {
    const starters: NormalizedPlayer[] = [];
    const substitutes: NormalizedPlayer[] = [];

    if (!Array.isArray(players)) return { starters, substitutes };

    for (const item of players) {
      const p = item.player;
      if (!p || !p.name) continue;

      const isStart = !item.substitute;
      const normalized: NormalizedPlayer = {
        player: p.name,
        number: item.jerseyNumber ? Number(item.jerseyNumber) : undefined,
        pos: item.position || p.position || undefined,
        grid: item.player?.grid || undefined,
        isStart,
        playerPhoto: p.id ? `https://api.sofascore.app/api/v1/player/${p.id}/image` : undefined,
        externalPlayerId: p.id ? Number(p.id) : undefined,
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
   * Consulta e normaliza escalações do Sofascore
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
      const eventId = await this.resolveSofaEventId(
        params.externalFixtureId,
        params.homeTeamName,
        params.awayTeamName,
        params.matchDate,
      );

      if (!eventId) {
        return null;
      }

      const url = `https://api.sofascore.com/api/v1/event/${eventId}/lineups`;
      const response = await axios.get(url, {
        headers: this.headers,
        timeout: 8000,
      });

      const data = response.data;
      if (!data) return null;

      const isConfirmed = Boolean(data.confirmed);
      const homeParsed = this.mapPlayers(data.home?.players);
      const awayParsed = this.mapPlayers(data.away?.players);

      const hasFullStarters = homeParsed.starters.length >= 11 && awayParsed.starters.length >= 11;

      if (!isConfirmed && !hasFullStarters) {
        return null;
      }

      this.logger.log(
        `[Sofascore] ✅ Escalações confirmadas obtidas para Event ${eventId} (${params.homeTeamName} ${homeParsed.starters.length}x${awayParsed.starters.length} ${params.awayTeamName})`,
      );

      return {
        success: true,
        confirmed: true,
        source: 'sofascore',
        formation: {
          home: data.home?.formation,
          away: data.away?.formation,
        },
        homeTeam: homeParsed,
        awayTeam: awayParsed,
      };
    } catch (err: any) {
      if (err.response?.status !== 404) {
        this.logger.warn(`[Sofascore] Falha ao consultar lineup da fixture ${params.externalFixtureId}: ${err.message}`);
      }
      return null;
    }
  }
}
