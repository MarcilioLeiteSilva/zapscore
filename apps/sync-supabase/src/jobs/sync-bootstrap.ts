import { ZapScoreClient } from '../zapscore-client';
import { supabase } from '../supabase-client';
import { mapTeamToSupabase, mapLeagueToSupabase } from '../mappers';

const LEAGUE_ID = parseInt(process.env.BRASILEIRAO_LEAGUE_ID ?? '71', 10);
const SEASON    = parseInt(process.env.SEASON ?? '2026', 10);

/**
 * Job de bootstrap — roda apenas no startup e diariamente às 01:00.
 * Sincroniza a liga e todos os times do Brasileirão.
 * Deve rodar ANTES de standings e matches.
 */
export async function syncBootstrap() {
  console.log(`[sync-bootstrap] ${new Date().toISOString()} — Iniciando...`);

  // 1. Busca a liga
  try {
    const leagues: any[] = await ZapScoreClient.getLeagues(LEAGUE_ID);
    for (const l of leagues) {
      const row = mapLeagueToSupabase(l);
      const { error } = await supabase
        .from('leagues')
        .upsert(row, { onConflict: 'external_id' });
      if (error) console.error(`[sync-bootstrap] Erro upsert liga ${l.name}: ${error.message}`);
      else console.log(`[sync-bootstrap] ✅ Liga: ${l.name}`);
    }
  } catch (err: any) {
    console.error(`[sync-bootstrap] Erro ao buscar liga: ${err.message}`);
  }

  // 2. Busca todos os times
  try {
    const teams: any[] = await ZapScoreClient.getTeamsByLeague(LEAGUE_ID, SEASON);
    console.log(`[sync-bootstrap] ${teams.length} time(s) encontrado(s).`);
    for (const t of teams) {
      const row = mapTeamToSupabase(t);
      const { error } = await supabase
        .from('teams')
        .upsert(row, { onConflict: 'external_id' });
      if (error) console.error(`[sync-bootstrap] Erro upsert time ${t.name}: ${error.message}`);
      else console.log(`[sync-bootstrap] ✅ Time: ${t.name}`);
    }
  } catch (err: any) {
    console.error(`[sync-bootstrap] Erro ao buscar times: ${err.message}`);
  }

  console.log(`[sync-bootstrap] Concluído.`);
}
