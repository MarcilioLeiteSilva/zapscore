import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { ILineupProvider, NormalizedLineupResult, NormalizedPlayer } from '../interfaces/lineup-provider.interface';

@Injectable()
export class EspnProvider implements ILineupProvider {
  readonly name = 'espn' as const;
  private readonly logger = new Logger(EspnProvider.name);

  // Mapeamento de League IDs da ZapScore/API-Football para códigos da ESPN
  private readonly leagueCodeMap: Record<number, string> = {
    39: 'eng.1', // Premier League
    140: 'esp.1', // La Liga
    78: 'ger.1', // Bundesliga
    61: 'fra.1', // Ligue 1
    135: 'ita.1', // Serie A
    71: 'bra.1', // Brasileirão Série A
    72: 'bra.2', // Brasileirão Série B
    2: 'uefa.champions', // UEFA Champions League
    13: 'conmebol.libertadores', // Copa Libertadores
  };

  private readonly headers = {
    'User-Agent': 'ESPN/5.0 (iPhone; iOS 17.0; Scale/3.00)',
    Accept: 'application/json',
  };

  private readonly fixtureToEspnEventMap = new Map<number, { eventId: string; leagueCode: string }>();
  private readonly scoreboardCache = new Map<string, { timestamp: number; events: any[] }>();

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
  private mapPosition(posName?: string, abbreviation?: string): string | undefined {
    if (abbreviation) {
      const a = abbreviation.toUpperCase();
      if (a === 'G' || a === 'GK') return 'G';
      if (a === 'D' || a === 'DF' || a === 'CB' || a === 'LB' || a === 'RB') return 'D';
      if (a === 'M' || a === 'MF' || a === 'DM' || a === 'CM' || a === 'AM') return 'M';
      if (a === 'F' || a === 'FW' || a === 'ST' || a === 'RW' || a === 'LW') return 'F';
    }
    if (posName) {
      const p = posName.toLowerCase();
      if (p.includes('goal') || p.includes('goleiro')) return 'G';
      if (p.includes('defen') || p.includes('zagueiro') || p.includes('lateral') || p.includes('back')) return 'D';
      if (p.includes('mid') || p.includes('meio') || p.includes('volante')) return 'M';
      if (p.includes('forw') || p.includes('atacante') || p.includes('striker') || p.includes('wing')) return 'F';
    }
    return undefined;
  }

  /**
   * Calcula posições táticas (grid) para os titulares a partir da formação (ex: "4-2-3-1", "4-3-3", "3-4-1-2")
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
   * Busca eventos agendados da ESPN por liga e data (cobrindo datas em BRT e UTC)
   */
  private async getEventsForLeagueAndDate(leagueCode: string, date: Date | string): Promise<any[]> {
    const d = new Date(date);
    const utcDateStr = !isNaN(d.getTime())
      ? `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, '0')}${String(d.getUTCDate()).padStart(2, '0')}`
      : '';

    // Data ajustada para o fuso brasileiro BRT (UTC-3)
    const brtDate = new Date(d.getTime() - 3 * 60 * 60 * 1000);
    const brtDateStr = !isNaN(brtDate.getTime())
      ? `${brtDate.getUTCFullYear()}${String(brtDate.getUTCMonth() + 1).padStart(2, '0')}${String(brtDate.getUTCDate()).padStart(2, '0')}`
      : '';

    const dateCandidates = Array.from(new Set([brtDateStr, utcDateStr].filter(Boolean)));
    const allEvents: any[] = [];
    const now = Date.now();

    for (const dateStr of dateCandidates) {
      const cacheKey = `${leagueCode}_${dateStr}`;
      const cached = this.scoreboardCache.get(cacheKey);

      if (cached && now - cached.timestamp < 10 * 60 * 1000) {
        allEvents.push(...cached.events);
        continue;
      }

      try {
        const url = `https://site.api.espn.com/apis/site/v2/sports/soccer/${leagueCode}/scoreboard?dates=${dateStr}`;
        const response = await axios.get(url, { headers: this.headers, timeout: 8000 });
        const events = response.data?.events || [];
        this.scoreboardCache.set(cacheKey, { timestamp: now, events });
        allEvents.push(...events);
      } catch (err: any) {
        this.logger.warn(`[ESPN] Falha ao consultar scoreboard para ${leagueCode} (${dateStr}): ${err.message}`);
      }
    }

    if (allEvents.length === 0) {
      try {
        const fallbackRes = await axios.get(
          `https://site.api.espn.com/apis/site/v2/sports/soccer/${leagueCode}/scoreboard`,
          { headers: this.headers, timeout: 8000 },
        );
        allEvents.push(...(fallbackRes.data?.events || []));
      } catch (_) {}
    }

    const uniqueMap = new Map();
    for (const ev of allEvents) {
      if (ev?.id && !uniqueMap.has(ev.id)) {
        uniqueMap.set(ev.id, ev);
      }
    }

    return Array.from(uniqueMap.values());
  }

  /**
   * Localiza o evento correspondente na ESPN
   */
  private async resolveEspnEvent(
    externalFixtureId: number,
    homeTeamName: string,
    awayTeamName: string,
    matchDate: Date | string,
    leagueExternalId?: number,
  ): Promise<{ eventId: string; leagueCode: string } | null> {
    if (this.fixtureToEspnEventMap.has(externalFixtureId)) {
      return this.fixtureToEspnEventMap.get(externalFixtureId)!;
    }

    const normHome = this.normalizeTeamName(homeTeamName);
    const normAway = this.normalizeTeamName(awayTeamName);

    // Se a liga é informada e não faz parte do catálogo da ESPN, ignora imediatamente
    if (leagueExternalId && !this.leagueCodeMap[leagueExternalId]) {
      return null;
    }

    const primaryCode = leagueExternalId ? this.leagueCodeMap[leagueExternalId] : undefined;
    const leagueCodes = primaryCode ? [primaryCode] : Object.values(this.leagueCodeMap);

    for (const code of leagueCodes) {
      const events = await this.getEventsForLeagueAndDate(code, matchDate);
      if (!events || events.length === 0) continue;

      for (const ev of events) {
        const competitors = ev.competitions?.[0]?.competitors || [];
        const homeComp = competitors.find((c: any) => c.homeAway === 'home')?.team;
        const awayComp = competitors.find((c: any) => c.homeAway === 'away')?.team;

        const evHome = this.normalizeTeamName(homeComp?.displayName || homeComp?.name || '');
        const evAway = this.normalizeTeamName(awayComp?.displayName || awayComp?.name || '');

        const isDirectMatch =
          (normHome.includes(evHome) || evHome.includes(normHome)) &&
          (normAway.includes(evAway) || evAway.includes(normAway));

        const isInverseMatch =
          (normHome.includes(evAway) || evAway.includes(normHome)) &&
          (normAway.includes(evHome) || evHome.includes(normAway));

        if (isDirectMatch || isInverseMatch) {
          const mapping = { eventId: String(ev.id), leagueCode: code };
          this.logger.log(
            `[ESPN] ✅ Pareamento encontrado: ${homeTeamName} x ${awayTeamName} ➔ Event ID: ${ev.id} (Liga: ${code})`,
          );
          this.fixtureToEspnEventMap.set(externalFixtureId, mapping);
          return mapping;
        }
      }
    }

    return null;
  }

  /**
   * Converte o roster da ESPN para NormalizedPlayer
   */
  private parseRoster(rosterData: any): { starters: NormalizedPlayer[]; substitutes: NormalizedPlayer[] } {
    const starters: NormalizedPlayer[] = [];
    const substitutes: NormalizedPlayer[] = [];

    const rawList = rosterData?.roster || [];
    if (!Array.isArray(rawList)) return { starters, substitutes };

    for (const item of rawList) {
      const ath = item.athlete;
      if (!ath) continue;

      const isStart = item.starter === true;
      const jerseyNumber = item.jersey ? Number(item.jersey) : undefined;
      const pos = this.mapPosition(item.position?.displayName || item.position?.name, item.position?.abbreviation);
      const photo = ath.headshot?.href || undefined;
      const externalPlayerId = ath.id ? Number(ath.id) : undefined;

      const normalized: NormalizedPlayer = {
        player: ath.displayName || ath.fullName || 'Jogador',
        number: jerseyNumber,
        pos,
        grid: undefined,
        isStart,
        playerPhoto: photo,
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
   * Consulta e normaliza escalações da ESPN
   */
  async getLineup(params: {
    homeTeamName: string;
    awayTeamName: string;
    matchDate: Date;
    externalFixtureId: number;
    homeTeamExternalId: number;
    awayTeamExternalId: number;
    leagueExternalId?: number;
  }): Promise<NormalizedLineupResult | null> {
    try {
      const match = await this.resolveEspnEvent(
        params.externalFixtureId,
        params.homeTeamName,
        params.awayTeamName,
        params.matchDate,
        params.leagueExternalId,
      );

      if (!match) return null;

      const summaryUrl = `https://site.api.espn.com/apis/site/v2/sports/soccer/${match.leagueCode}/summary?event=${match.eventId}`;
      const response = await axios.get(summaryUrl, { headers: this.headers, timeout: 8000 });

      const rosters = response.data?.rosters || [];
      if (!Array.isArray(rosters) || rosters.length < 2) return null;

      // Identifica mandante e visitante pelos competitors
      const headerCompetitors = response.data?.header?.competitions?.[0]?.competitors || [];
      const homeComp = headerCompetitors.find((c: any) => c.homeAway === 'home');
      const awayComp = headerCompetitors.find((c: any) => c.homeAway === 'away');

      let homeRoster = rosters[0];
      let awayRoster = rosters[1];

      if (homeComp && awayComp) {
        const r0TeamId = String(rosters[0]?.team?.id);
        const r1TeamId = String(rosters[1]?.team?.id);
        if (r0TeamId === String(awayComp.id) && r1TeamId === String(homeComp.id)) {
          homeRoster = rosters[1];
          awayRoster = rosters[0];
        }
      }

      const homeParsed = this.parseRoster(homeRoster);
      const awayParsed = this.parseRoster(awayRoster);

      if (homeParsed.starters.length < 11 || awayParsed.starters.length < 11) {
        return null;
      }

      this.calculateGrid(homeParsed.starters, homeRoster?.formation);
      this.calculateGrid(awayParsed.starters, awayRoster?.formation);

      this.logger.log(
        `[ESPN] 🏆 Escalações confirmadas obtidas com sucesso para ${params.homeTeamName} x ${params.awayTeamName} (${homeParsed.starters.length}x${awayParsed.starters.length} titulares)`,
      );

      return {
        success: true,
        confirmed: true,
        source: 'espn',
        formation: {
          home: homeRoster?.formation,
          away: awayRoster?.formation,
        },
        homeTeam: homeParsed,
        awayTeam: awayParsed,
      };
    } catch (err: any) {
      if (err.response?.status !== 404) {
        this.logger.warn(`[ESPN] Falha ao consultar lineup da fixture ${params.externalFixtureId}: ${err.message}`);
      }
      return null;
    }
  }
}
