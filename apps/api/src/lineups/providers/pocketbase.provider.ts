import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { ILineupProvider, NormalizedLineupResult, NormalizedPlayer } from '../interfaces/lineup-provider.interface';

export interface PocketbaseLineupResult extends NormalizedLineupResult {
  recordId?: string;
}

@Injectable()
export class PocketbaseProvider implements ILineupProvider {
  readonly name = 'pocketbase' as const;
  private readonly logger = new Logger(PocketbaseProvider.name);

  private readonly baseUrl =
    process.env.POCKETBASE_LINEUPS_URL || 'https://zapscore-pocketbase-multiapkagent.gtalg3.easypanel.host';
  private readonly email = process.env.POCKETBASE_LINEUPS_EMAIL || 'prolaser2005@hotmail.com';
  private readonly password = process.env.POCKETBASE_LINEUPS_PASSWORD || 'Cascavel@#01';

  private authToken: string | null = null;
  private tokenExpiresAt = 0;

  /**
   * Autenticação de superuser no PocketBase com cache de token
   */
  private async getAuthToken(): Promise<string | null> {
    const now = Date.now();
    if (this.authToken && now < this.tokenExpiresAt - 60000) {
      return this.authToken;
    }

    try {
      const url = `${this.baseUrl}/api/collections/_superusers/auth-with-password`;
      const response = await axios.post(
        url,
        {
          identity: this.email,
          password: this.password,
        },
        { timeout: 8000 },
      );

      this.authToken = response.data?.token || null;
      this.tokenExpiresAt = now + 2 * 60 * 60 * 1000; // 2 horas de validade segura
      return this.authToken;
    } catch (err: any) {
      this.logger.warn(`[PocketBase] Falha ao autenticar: ${err.message}`);
      return null;
    }
  }

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
   * Mapeia os jogadores salvos na collection do PocketBase
   */
  private parsePlayers(players: any[]): { starters: NormalizedPlayer[]; substitutes: NormalizedPlayer[] } {
    const starters: NormalizedPlayer[] = [];
    const substitutes: NormalizedPlayer[] = [];

    if (!Array.isArray(players)) return { starters, substitutes };

    for (const p of players) {
      const isStart = p.starter !== false;
      const normalized: NormalizedPlayer = {
        player: p.name || p.player || 'Jogador',
        number: p.number ? Number(p.number) : undefined,
        pos: p.position || p.pos || undefined,
        grid: p.grid || undefined,
        isStart,
        playerPhoto: p.photo || p.playerPhoto || undefined,
        externalPlayerId: p.id ? Number(p.id) : (p.externalPlayerId ? Number(p.externalPlayerId) : undefined),
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
   * Busca e extrai escalação RESOLVED no PocketBase para a partida
   */
  async getLineup(params: {
    homeTeamName: string;
    awayTeamName: string;
    matchDate: Date;
    externalFixtureId: number;
    homeTeamExternalId: number;
    awayTeamExternalId: number;
    fixtureId?: string;
  }): Promise<PocketbaseLineupResult | null> {
    const token = await this.getAuthToken();
    if (!token) return null;

    try {
      // Busca registros de escalação que já foram validadas e estão com status RESOLVED
      const url = `${this.baseUrl}/api/collections/match_lineups/records?filter=(status='RESOLVED')&perPage=50`;
      const response = await axios.get(url, {
        headers: { Authorization: token },
        timeout: 8000,
      });

      const records = response.data?.items || [];
      if (records.length === 0) return null;

      const normHome = this.normalizeTeamName(params.homeTeamName);
      const normAway = this.normalizeTeamName(params.awayTeamName);

      for (const rec of records) {
        const isZapIdMatch =
          params.fixtureId && (rec.zapscore_match_id === params.fixtureId || rec.match_id === params.fixtureId);

        const isExternalIdMatch = rec.zapscore_match_id === String(params.externalFixtureId);

        const recHome = this.normalizeTeamName(rec.home_team || '');
        const recAway = this.normalizeTeamName(rec.away_team || '');

        const isNameMatch =
          (normHome.includes(recHome) || recHome.includes(normHome)) &&
          (normAway.includes(recAway) || recAway.includes(normAway));

        if (isZapIdMatch || isExternalIdMatch || isNameMatch) {
          const homeParsed = this.parsePlayers(rec.home_players);
          const awayParsed = this.parsePlayers(rec.away_players);

          if (homeParsed.starters.length >= 11 && awayParsed.starters.length >= 11) {
            this.logger.log(
              `[PocketBase] ✅ Escalação RESOLVED encontrada para ${params.homeTeamName} x ${params.awayTeamName} (Record: ${rec.id})`,
            );

            return {
              success: true,
              confirmed: true,
              source: 'pocketbase',
              recordId: rec.id,
              formation: {
                home: rec.formation_home,
                away: rec.formation_away,
              },
              homeTeam: homeParsed,
              awayTeam: awayParsed,
            };
          }
        }
      }

      return null;
    } catch (err: any) {
      this.logger.warn(`[PocketBase] Falha ao consultar match_lineups: ${err.message}`);
      return null;
    }
  }

  /**
   * Atualiza o status do registro no PocketBase para SYNCED após gravação no PostgreSQL
   */
  async markAsSynced(recordId: string): Promise<void> {
    if (!recordId) return;
    const token = await this.getAuthToken();
    if (!token) return;

    try {
      const url = `${this.baseUrl}/api/collections/match_lineups/records/${recordId}`;
      await axios.patch(
        url,
        { status: 'SYNCED' },
        {
          headers: { Authorization: token },
          timeout: 6000,
        },
      );
      this.logger.log(`[PocketBase] 🏁 Registro ${recordId} marcado como SYNCED com sucesso!`);
    } catch (err: any) {
      this.logger.warn(`[PocketBase] Falha ao atualizar status para SYNCED no record ${recordId}: ${err.message}`);
    }
  }

  /**
   * Ingestão automática das partidas do dia na collection active_fixtures do PocketBase
   */
  async syncActiveFixtures(fixtures: any[]): Promise<void> {
    const token = await this.getAuthToken();
    if (!token || !Array.isArray(fixtures) || fixtures.length === 0) return;

    try {
      const existingRes = await axios.get(
        `${this.baseUrl}/api/collections/active_fixtures/records?perPage=100`,
        { headers: { Authorization: token }, timeout: 8000 },
      );
      const existingZapIds = new Set((existingRes.data?.items || []).map((f: any) => f.zapscore_match_id));

      for (const f of fixtures) {
        if (existingZapIds.has(f.id)) continue;

        const payload = {
          zapscore_match_id: f.id,
          competition_id: f.league?.id || '',
          competition_name: f.league?.name || '',
          home_team_id: f.homeTeam?.id || '',
          away_team_id: f.awayTeam?.id || '',
          home_team_name: f.homeTeam?.name || '',
          away_team_name: f.awayTeam?.name || '',
          match_date: f.date,
          status: f.statusShort === 'NS' ? 'SCHEDULED' : f.statusShort === 'FT' ? 'FINISHED' : 'LIVE',
        };

        try {
          await axios.post(
            `${this.baseUrl}/api/collections/active_fixtures/records`,
            payload,
            { headers: { Authorization: token }, timeout: 6000 },
          );
          this.logger.log(`[PocketBase] 📥 Partida ${f.homeTeam?.name} x ${f.awayTeam?.name} cadastrada em active_fixtures`);
        } catch (postErr: any) {
          // Registro já existe ou erro ignorado
        }

        // Criação de aliases básicos para os dois times
        const teams = [f.homeTeam, f.awayTeam].filter(Boolean);
        for (const t of teams) {
          try {
            await axios.post(
              `${this.baseUrl}/api/collections/team_aliases/records`,
              {
                alias: t.name,
                canonical_name: t.name,
                zapscore_team_id: t.id,
              },
              { headers: { Authorization: token }, timeout: 4000 },
            );
          } catch (aliasErr) {
            // já existe
          }
        }
      }
    } catch (err: any) {
      this.logger.warn(`[PocketBase] Falha ao sincronizar active_fixtures: ${err.message}`);
    }
  }
}
