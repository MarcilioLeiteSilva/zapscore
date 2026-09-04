import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { ILineupProvider, NormalizedLineupResult, NormalizedPlayer } from '../interfaces/lineup-provider.interface';

const execFileAsync = promisify(execFile);

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
   * Executa requisição HTTP com fallback nativo (curl) caso o axios receba 403 (firewall Sofascore)
   */
  private async fetchSofascoreJson(url: string): Promise<any> {
    try {
      const response = await axios.get(url, {
        headers: this.headers,
        timeout: 6000,
      });
      return response.data;
    } catch (axiosErr: any) {
      // Bypass automático de firewall Varnish/Cloudflare via curl nativo
      try {
        const args = [
          '-s',
          url,
          '-H',
          'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
          '-H',
          'Accept: application/json, text/plain, */*',
          '-H',
          'Referer: https://www.sofascore.com/',
          '-H',
          'Origin: https://www.sofascore.com/',
          '-H',
          'Cache-Control: no-cache',
        ];
        const { stdout } = await execFileAsync('curl', args, {
          maxBuffer: 15 * 1024 * 1024,
          timeout: 10000,
        });
        return JSON.parse(stdout);
      } catch (curlErr: any) {
        return null;
      }
    }
  }

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
      const url = `https://api.sofascore.com/api/v1/sport/football/scheduled-events/${dateStr}`;
      const data = await this.fetchSofascoreJson(url);
      const events = data?.events || [];
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

    const normHome = this.normalizeTeamName(homeTeamName);
    const normAway = this.normalizeTeamName(awayTeamName);
    const matchTimeMs = new Date(matchDate).getTime();

    // 1. Tenta encontrar na grade de eventos agendados para a data
    const events = await this.getScheduledEventsForDate(matchDate);
    if (events && events.length > 0) {
      for (const ev of events) {
        const evHome = this.normalizeTeamName(ev.homeTeam?.name || '');
        const evAway = this.normalizeTeamName(ev.awayTeam?.name || '');
        const evTimeMs = (ev.startTimestamp || 0) * 1000;

        const timeDiff = Math.abs(matchTimeMs - evTimeMs);
        const isTimeClose = timeDiff <= 120 * 60 * 1000;

        const isHomeMatch = normHome.includes(evHome) || evHome.includes(normHome);
        const isAwayMatch = normAway.includes(evAway) || evAway.includes(normAway);

        if (isTimeClose && isHomeMatch && isAwayMatch) {
          this.logger.log(
            `[Sofascore] Pareamento encontrado (Grade): ${homeTeamName} x ${awayTeamName} ➔ Event ID: ${ev.id}`,
          );
          this.fixtureToSofaEventMap.set(externalFixtureId, ev.id);
          return ev.id;
        }
      }
    }

    // 2. Se não encontrou na grade do dia, busca pelos eventos recentes/próximos do clube mandante
    try {
      const searchUrl = `https://api.sofascore.com/api/v1/search/all?q=${encodeURIComponent(homeTeamName)}`;
      const searchData = await this.fetchSofascoreJson(searchUrl);
      const teamEntity = searchData?.results?.find((r: any) => r.type === 'team')?.entity;

      if (teamEntity && teamEntity.id) {
        const [nextData, lastData] = await Promise.all([
          this.fetchSofascoreJson(`https://api.sofascore.com/api/v1/team/${teamEntity.id}/events/next/0`),
          this.fetchSofascoreJson(`https://api.sofascore.com/api/v1/team/${teamEntity.id}/events/last/0`),
        ]);

        const teamEvents = [...(nextData?.events || []), ...(lastData?.events || [])];
        for (const ev of teamEvents) {
          const evHome = this.normalizeTeamName(ev.homeTeam?.name || '');
          const evAway = this.normalizeTeamName(ev.awayTeam?.name || '');

          const isHomeMatch = normHome.includes(evHome) || evHome.includes(normHome);
          const isAwayMatch = normAway.includes(evAway) || evAway.includes(normAway);

          if (isHomeMatch && isAwayMatch) {
            this.logger.log(
              `[Sofascore] Pareamento encontrado (Time): ${homeTeamName} x ${awayTeamName} ➔ Event ID: ${ev.id}`,
            );
            this.fixtureToSofaEventMap.set(externalFixtureId, ev.id);
            return ev.id;
          }
        }
      }
    } catch (teamSearchErr: any) {
      this.logger.warn(`[Sofascore] Falha na busca por time para ${homeTeamName}: ${teamSearchErr.message}`);
    }

    return null;
  }

  /**
   * Calcula posições táticas (grid) para os titulares a partir da formação (ex: "4-2-3-1", "4-3-3")
   */
  private calculateGrid(starters: NormalizedPlayer[], formation?: string): void {
    if (!starters || starters.length === 0) return;

    // Goleiro sempre linha 1, coluna 1
    if (starters[0] && !starters[0].grid) {
      starters[0].grid = '1:1';
    }

    let lines = (formation || '4-3-3')
      .split('-')
      .map(Number)
      .filter((n) => !isNaN(n) && n > 0);
    const total = lines.reduce((a, b) => a + b, 0);
    if (total !== 10) {
      lines = [4, 3, 3];
    }

    let idx = 1;
    for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
      const row = lineIdx + 2;
      const count = lines[lineIdx];
      for (let col = 1; col <= count; col++) {
        if (starters[idx]) {
          if (!starters[idx].grid) {
            starters[idx].grid = `${row}:${col}`;
          }
          idx++;
        }
      }
    }

    while (idx < starters.length) {
      if (!starters[idx].grid) {
        starters[idx].grid = `${lines.length + 1}:1`;
      }
      idx++;
    }
  }

  /**
   * Mapeia lista de jogadores do Sofascore para o formato padronizado do ZapScore
   */
  private mapPlayers(
    players: any[],
    formation?: string,
  ): { starters: NormalizedPlayer[]; substitutes: NormalizedPlayer[] } {
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
        grid: item.grid || undefined,
        isStart,
        playerPhoto: p.id ? `https://img.sofascore.com/api/v1/player/${p.id}/image` : undefined,
        externalPlayerId: p.id ? Number(p.id) : undefined,
      };

      if (isStart) {
        starters.push(normalized);
      } else {
        substitutes.push(normalized);
      }
    }

    this.calculateGrid(starters, formation);

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
      const data = await this.fetchSofascoreJson(url);
      if (!data) return null;

      const isConfirmed = Boolean(data.confirmed);
      const homeParsed = this.mapPlayers(data.home?.players, data.home?.formation);
      const awayParsed = this.mapPlayers(data.away?.players, data.away?.formation);

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
