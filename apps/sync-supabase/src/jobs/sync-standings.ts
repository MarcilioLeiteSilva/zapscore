import { ZapScoreClient } from '../zapscore-client';
import { supabase } from '../supabase-client';
import { mapStandingToSupabase } from '../mappers';

const LEAGUE_ID = parseInt(process.env.BRASILEIRAO_LEAGUE_ID ?? '71', 10);
const SEASON    = parseInt(process.env.SEASON ?? '2026', 10);

/**
 * Job de classificação — roda a cada 6 horas.
 * Sincroniza a tabela de classificação completa do Brasileirão Série A.
 */
export async function syncStandings() {
  console.log(`[sync-standings] ${new Date().toISOString()} — Iniciando...`);

  let standings: any[];
  try {
    standings = await ZapScoreClient.getStandings(LEAGUE_ID, SEASON);
  } catch (err: any) {
    console.error(`[sync-standings] Erro ao buscar standings: ${err.message}`);
    return;
  }

  if (!standings || standings.length === 0) {
    console.log(`[sync-standings] Nenhum dado de classificação retornado.`);
    return;
  }

  console.log(`[sync-standings] ${standings.length} posição(ões) encontrada(s).`);

  for (const standing of standings) {
    try {
      const row = mapStandingToSupabase(standing);
      const { error } = await supabase
        .from('group_standings')
        .upsert(row, { onConflict: 'id' });
      if (error) {
        console.error(`[sync-standings] Erro upsert standing pos ${standing.rank}: ${error.message}`);
      } else {
        console.log(`[sync-standings] ✅ ${standing.rank}° ${standing.team?.name ?? standing.teamId} — ${standing.points}pts`);
      }
    } catch (err: any) {
      console.error(`[sync-standings] Erro processando standing: ${err.message}`);
    }
  }

  console.log(`[sync-standings] Concluído.`);
}
