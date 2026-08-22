import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class PocketBaseSyncService {
  private readonly logger = new Logger(PocketBaseSyncService.name);
  private pbUrl: string;
  private token: string | null = null;
  private isAuthenticating = false;

  constructor(private readonly configService: ConfigService) {
    this.pbUrl = this.configService.get<string>('POCKETBASE_URL') || '';
    if (this.pbUrl) {
      this.pbUrl = this.pbUrl.replace(/\/$/, '') + '/api';
    }
  }

  private get isEnabled(): boolean {
    return !!this.pbUrl && !!this.configService.get<string>('POCKETBASE_ADMIN_EMAIL');
  }

  private getDeterministicId(prefix: string, externalId: number): string {
    const raw = `${prefix}${externalId}`;
    if (raw.length >= 15) {
      return raw.substring(0, 15).toLowerCase().replace(/[^a-z0-9]/g, '0');
    }
    return raw.padEnd(15, '0').toLowerCase().replace(/[^a-z0-9]/g, '0');
  }

  private async authenticate() {
    if (this.isAuthenticating) return;
    this.isAuthenticating = true;

    const email = this.configService.get<string>('POCKETBASE_ADMIN_EMAIL');
    const password = this.configService.get<string>('POCKETBASE_ADMIN_PASSWORD');

    try {
      this.logger.log(`Authenticating with PocketBase admin at ${this.pbUrl}...`);
      const res = await axios.post(`${this.pbUrl}/admins/auth-with-password`, {
        identity: email,
        password: password,
      });
      this.token = res.data.token;
      this.logger.log('PocketBase Admin authenticated successfully.');
    } catch (err: any) {
      this.logger.error(`PocketBase Authentication failed: ${err.message}`);
      this.token = null;
    } finally {
      this.isAuthenticating = false;
    }
  }

  private async getHeaders() {
    if (!this.token) {
      await this.authenticate();
    }
    return {
      Authorization: `Admin ${this.token}`,
      'Content-Type': 'application/json',
    };
  }

  private async executeWithRetry(fn: () => Promise<any>): Promise<any> {
    try {
      return await fn();
    } catch (err: any) {
      if (err.response?.status === 401) {
        this.logger.warn('PocketBase token expired. Re-authenticating...');
        this.token = null;
        await this.authenticate();
        return await fn();
      }
      throw err;
    }
  }

  private async upsert(collectionName: string, id: string, data: any) {
    if (!this.isEnabled) return null;

    return this.executeWithRetry(async () => {
      const headers = await this.getHeaders();
      try {
        // Tenta atualizar primeiro
        const res = await axios.patch(
          `${this.pbUrl}/collections/${collectionName}/records/${id}`,
          data,
          { headers }
        );
        return res.data.id;
      } catch (err: any) {
        if (err.response?.status === 404) {
          // Se não existir, cria
          const res = await axios.post(
            `${this.pbUrl}/collections/${collectionName}/records`,
            { id, ...data },
            { headers }
          );
          return res.data.id;
        }
        throw err;
      }
    });
  }

  async syncLeague(league: any) {
    try {
      const id = this.getDeterministicId('comp', league.externalId);
      const data = {
        externalId: league.externalId,
        name: league.name,
        country: league.country || 'Brazil',
        logo: league.logo || `https://media.api-sports.io/football/leagues/${league.externalId}.png`,
        type: league.type || 'League',
        activeSeasons: league.activeSeasons || [2026],
      };
      await this.upsert('competitions', id, data);
    } catch (err: any) {
      this.logger.error(`Error syncing league ${league.externalId} to PocketBase: ${err.message}`);
    }
  }

  async syncTeam(team: any) {
    try {
      const id = this.getDeterministicId('team', team.externalId);
      const data = {
        externalId: team.externalId,
        name: team.name,
        code: team.code || null,
        country: team.country || 'Brazil',
        logo: team.logo || `https://media.api-sports.io/football/teams/${team.externalId}.png`,
        founded: team.founded || null,
        national: team.national || false,
      };
      await this.upsert('teams', id, data);
    } catch (err: any) {
      this.logger.error(`Error syncing team ${team.externalId} to PocketBase: ${err.message}`);
    }
  }

  async syncFixture(fixture: any, leagueExternalId: number, homeTeamExternalId: number, awayTeamExternalId: number) {
    try {
      const id = this.getDeterministicId('fix', fixture.externalId);
      const data = {
        externalId: fixture.externalId,
        leagueId: this.getDeterministicId('comp', leagueExternalId),
        season: fixture.season,
        date: new Date(fixture.date).toISOString(),
        round: fixture.round || null,
        statusLong: fixture.statusLong || null,
        statusShort: fixture.statusShort || null,
        elapsed: fixture.elapsed || null,
        venueName: fixture.venueName || null,
        venueCity: fixture.venueCity || null,
        homeTeamId: this.getDeterministicId('team', homeTeamExternalId),
        awayTeamId: this.getDeterministicId('team', awayTeamExternalId),
        homeGoals: fixture.homeGoals !== undefined ? fixture.homeGoals : null,
        awayGoals: fixture.awayGoals !== undefined ? fixture.awayGoals : null,
        oddsHome: fixture.oddsHome || null,
        oddsDraw: fixture.oddsDraw || null,
        oddsAway: fixture.oddsAway || null,
      };
      await this.upsert('fixtures', id, data);
    } catch (err: any) {
      this.logger.error(`Error syncing fixture ${fixture.externalId} to PocketBase: ${err.message}`);
    }
  }

  async syncStanding(standing: any, leagueExternalId: number, teamExternalId: number) {
    try {
      // standing unique index key: leagueId + teamId + season
      const leaguePbId = this.getDeterministicId('comp', leagueExternalId);
      const teamPbId = this.getDeterministicId('team', teamExternalId);
      const season = standing.season;
      // Gerar ID determinístico composto para o record de standing
      const standingRawId = `std_${leagueExternalId}_${teamExternalId}_${season}`;
      // PocketBase id precisa ter 15 chars, vamos gerar um hash do id composto ou usar deterministic id padronizado
      const id = this.getDeterministicId('std', Math.abs(this.hashCode(standingRawId)));

      const data = {
        leagueId: leaguePbId,
        teamId: teamPbId,
        season: season,
        rank: standing.rank,
        points: standing.points,
        goalsFor: standing.goalsFor,
        goalsAgainst: standing.goalsAgainst,
        goalsDiff: standing.goalsDiff,
        played: standing.played,
        win: standing.win,
        draw: standing.draw,
        lose: standing.lose,
      };
      await this.upsert('standings', id, data);
    } catch (err: any) {
      this.logger.error(`Error syncing standing for team ${teamExternalId} to PocketBase: ${err.message}`);
    }
  }

  async syncScorer(scorer: any, leagueExternalId: number) {
    try {
      const leaguePbId = this.getDeterministicId('comp', leagueExternalId);
      const scorerRawId = `scr_${leagueExternalId}_${scorer.playerName}_${scorer.teamName}`;
      const id = this.getDeterministicId('scr', Math.abs(this.hashCode(scorerRawId)));

      const data = {
        leagueId: leaguePbId,
        season: scorer.season,
        rank: scorer.rank,
        playerName: scorer.playerName,
        playerPhoto: scorer.playerPhoto || null,
        teamName: scorer.teamName,
        teamLogo: scorer.teamLogo || null,
        goals: scorer.goals,
        assists: scorer.assists || 0,
        externalPlayerId: scorer.externalPlayerId || null,
      };
      await this.upsert('scorers', id, data);
    } catch (err: any) {
      this.logger.error(`Error syncing scorer ${scorer.playerName} to PocketBase: ${err.message}`);
    }
  }

  async syncFixtureEvents(fixtureExternalId: number, events: any[]) {
    if (!this.isEnabled) return;
    const fixturePbId = this.getDeterministicId('fix', fixtureExternalId);

    try {
      const headers = await this.getHeaders();
      
      // 1. Limpar eventos anteriores no PocketBase
      // Como limpamos de forma assíncrona, buscamos todos os registros com fixtureId correspondente e os deletamos
      await this.executeWithRetry(async () => {
        const searchRes = await axios.get(
          `${this.pbUrl}/collections/fixture_events/records?filter=fixtureId="${fixturePbId}"&limit=100`,
          { headers }
        );
        const items = searchRes.data.items || [];
        for (const item of items) {
          await axios.delete(`${this.pbUrl}/collections/fixture_events/records/${item.id}`, { headers });
        }
      });

      // 2. Inserir novos eventos
      for (const [index, e] of events.entries()) {
        const eventId = this.getDeterministicId('evt', Math.abs(this.hashCode(`evt_${fixtureExternalId}_${index}`)));
        const data = {
          id: eventId,
          fixtureId: fixturePbId,
          time: e.time,
          teamId: e.teamId,
          player: e.player || null,
          assist: e.assist || null,
          type: e.type,
          detail: e.detail || null,
          playerPhoto: e.playerPhoto || null,
          externalPlayerId: e.externalPlayerId || null,
        };
        
        await this.executeWithRetry(async () => {
          await axios.post(`${this.pbUrl}/collections/fixture_events/records`, data, { headers });
        });
      }
    } catch (err: any) {
      this.logger.error(`Error syncing events for fixture ${fixtureExternalId}: ${err.message}`);
    }
  }

  async syncFixtureStats(fixtureExternalId: number, stats: any[]) {
    if (!this.isEnabled) return;
    const fixturePbId = this.getDeterministicId('fix', fixtureExternalId);

    try {
      for (const s of stats) {
        const statRawId = `stat_${fixtureExternalId}_${s.teamId}_${s.type}`;
        const id = this.getDeterministicId('sta', Math.abs(this.hashCode(statRawId)));
        
        const data = {
          fixtureId: fixturePbId,
          teamId: s.teamId,
          type: s.type,
          value: String(s.value || '0'),
        };

        await this.upsert('fixture_stats', id, data);
      }
    } catch (err: any) {
      this.logger.error(`Error syncing stats for fixture ${fixtureExternalId}: ${err.message}`);
    }
  }

  async syncFixtureLineups(fixtureExternalId: number, lineups: any[]) {
    if (!this.isEnabled) return;
    const fixturePbId = this.getDeterministicId('fix', fixtureExternalId);

    try {
      const headers = await this.getHeaders();
      
      // 1. Limpar escalações anteriores
      await this.executeWithRetry(async () => {
        const searchRes = await axios.get(
          `${this.pbUrl}/collections/fixture_lineups/records?filter=fixtureId="${fixturePbId}"&limit=100`,
          { headers }
        );
        const items = searchRes.data.items || [];
        for (const item of items) {
          await axios.delete(`${this.pbUrl}/collections/fixture_lineups/records/${item.id}`, { headers });
        }
      });

      // 2. Inserir novas escalações
      for (const [index, p] of lineups.entries()) {
        const lineupId = this.getDeterministicId('lin', Math.abs(this.hashCode(`lin_${fixtureExternalId}_${index}`)));
        const data = {
          id: lineupId,
          fixtureId: fixturePbId,
          teamId: p.teamId,
          player: p.player,
          number: p.number || null,
          pos: p.pos || null,
          grid: p.grid || null,
          isStart: p.isStart !== undefined ? p.isStart : true,
          playerPhoto: p.playerPhoto || null,
          externalPlayerId: p.externalPlayerId || null,
        };

        await this.executeWithRetry(async () => {
          await axios.post(`${this.pbUrl}/collections/fixture_lineups/records`, data, { headers });
        });
      }
    } catch (err: any) {
      this.logger.error(`Error syncing lineups for fixture ${fixtureExternalId}: ${err.message}`);
    }
  }

  async syncFixtureAiAnalysis(analysis: any, fixtureExternalId: number) {
    try {
      const fixturePbId = this.getDeterministicId('fix', fixtureExternalId);
      const id = this.getDeterministicId('aia', fixtureExternalId); // ID determinístico único por partida

      const data = {
        fixtureId: fixturePbId,
        probHome: analysis.probHome,
        probAway: analysis.probAway,
        probDraw: analysis.probDraw,
        predictionSummary: analysis.predictionSummary,
        tips: analysis.tips || [],
        commentary: analysis.commentary,
      };

      await this.upsert('fixture_ai_analysis', id, data);
    } catch (err: any) {
      this.logger.error(`Error syncing AI analysis for fixture ${fixtureExternalId}: ${err.message}`);
    }
  }

  private hashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0; // Convert to 32bit integer
    }
    return hash;
  }
}
