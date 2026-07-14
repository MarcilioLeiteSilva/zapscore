import { supabase } from './supabase-client';

class IdMapperClass {
  private leagueMap: Map<number, string> = new Map();
  private teamMap: Map<number, string> = new Map();
  private matchMap: Map<number, string> = new Map();

  async initialize() {
    console.log('[IdMapper] Inicializando mapas de IDs do Supabase...');

    // 1. Carrega ligas do Supabase
    const { data: leagues, error: lErr } = await supabase
      .from('leagues')
      .select('id, external_id');
    if (lErr) {
      console.error(`[IdMapper] Erro ao carregar ligas: ${lErr.message}`);
    } else if (leagues) {
      for (const l of leagues) {
        if (l.external_id) {
          this.leagueMap.set(parseInt(l.external_id, 10), l.id);
        }
      }
    }

    // 2. Carrega times do Supabase
    const { data: teams, error: tErr } = await supabase
      .from('teams')
      .select('id, external_id');
    if (tErr) {
      console.error(`[IdMapper] Erro ao carregar times: ${tErr.message}`);
    } else if (teams) {
      for (const t of teams) {
        if (t.external_id) {
          this.teamMap.set(parseInt(t.external_id, 10), t.id);
        }
      }
    }

    // 3. Carrega matches do Supabase
    const { data: matches, error: mErr } = await supabase
      .from('matches')
      .select('id, api_football_fixture_id');
    if (mErr) {
      console.error(`[IdMapper] Erro ao carregar matches: ${mErr.message}`);
    } else if (matches) {
      for (const m of matches) {
        if (m.api_football_fixture_id) {
          this.matchMap.set(m.api_football_fixture_id, m.id);
        }
      }
    }

    console.log(
      `[IdMapper] Mapeamento concluído: ${this.leagueMap.size} ligas, ${this.teamMap.size} times, ${this.matchMap.size} matches em cache.`
    );
  }

  getSupabaseLeagueUuid(externalId: number): string | undefined {
    return this.leagueMap.get(externalId);
  }

  getSupabaseTeamUuid(externalId: number): string | undefined {
    return this.teamMap.get(externalId);
  }

  getSupabaseMatchUuid(fixtureExternalId: number): string | undefined {
    return this.matchMap.get(fixtureExternalId);
  }

  addLeague(externalId: number, uuid: string) {
    this.leagueMap.set(externalId, uuid);
  }

  addTeam(externalId: number, uuid: string) {
    this.teamMap.set(externalId, uuid);
  }

  addMatch(fixtureExternalId: number, uuid: string) {
    this.matchMap.set(fixtureExternalId, uuid);
  }
}

export const IdMapper = new IdMapperClass();
