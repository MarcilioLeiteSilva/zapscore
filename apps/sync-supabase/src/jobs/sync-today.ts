import { ZapScoreClient } from '../zapscore-client';
import { supabase } from '../supabase-client';
import { mapFixtureToMatch, mapSyncControl } from '../mappers';

const LEAGUE_ID = parseInt(process.env.BRASILEIRAO_LEAGUE_ID ?? '71', 10);

/**
 * Job de sincronização do dia — roda a cada 30 minutos.
 * Atualiza o placar e status de TODAS as partidas do dia no Supabase,
 * incluindo as que ainda não começaram e as já finalizadas.
 */
export async function syncToday() {
  console.log(`[sync-today] ${new Date().toISOString()} — Iniciando...`);

  let fixtures: any[];
  try {
    fixtures = await ZapScoreClient.getTodayFixtures(LEAGUE_ID);
  } catch (err: any) {
    console.error(`[sync-today] Erro ao buscar fixtures: ${err.message}`);
    return;
  }

  if (fixtures.length === 0) {
    console.log(`[sync-today] Nenhuma partida hoje.`);
    return;
  }

  console.log(`[sync-today] ${fixtures.length} partida(s) encontrada(s).`);

  for (const fixture of fixtures) {
    try {
      // Upsert dados principais da partida
      const matchRow = mapFixtureToMatch(fixture);
      const { error: matchErr } = await supabase
        .from('matches')
        .upsert(matchRow, { onConflict: 'id' });
      if (matchErr) {
        console.error(`[sync-today] Erro upsert match ${fixture.id}: ${matchErr.message}`);
        continue;
      }

      // Atualiza sync control (apenas core)
      const syncCtrl = mapSyncControl(fixture, { core: true });
      await supabase.from('fixture_sync_control')
        .upsert(syncCtrl, { onConflict: 'fixture_id' });

      console.log(`[sync-today] ✅ ${fixture.homeTeam?.name ?? fixture.homeTeamId} x ${fixture.awayTeam?.name ?? fixture.awayTeamId} — status: ${fixture.statusShort}`);
    } catch (err: any) {
      console.error(`[sync-today] Erro processando fixture ${fixture.id}: ${err.message}`);
    }
  }

  console.log(`[sync-today] Concluído.`);
}
