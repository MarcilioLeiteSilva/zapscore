import { ZapScoreClient } from '../zapscore-client';
import { supabase } from '../supabase-client';
import {
  mapFixtureToMatch,
  mapEventToSupabase,
  mapStatsToSupabase,
  mapLineupsToSupabase,
  mapSyncControl,
} from '../mappers';

const LEAGUE_ID = parseInt(process.env.BRASILEIRAO_LEAGUE_ID ?? '71', 10);
const LIVE_STATUSES = ['1H', '2H', 'HT', 'ET', 'P', 'BT', 'LIVE'];

/**
 * Job de sincronização ao vivo — roda a cada 1 minuto.
 * Busca partidas de hoje do Brasileirão, filtra as que estão ao vivo,
 * e sincroniza placar, eventos, stats e escalações no Supabase.
 */
export async function syncLive() {
  console.log(`[sync-live] ${new Date().toISOString()} — Iniciando...`);

  let fixtures: any[];
  try {
    fixtures = await ZapScoreClient.getTodayFixtures(LEAGUE_ID);
  } catch (err: any) {
    console.error(`[sync-live] Erro ao buscar fixtures do dia: ${err.message}`);
    return;
  }

  const liveFixtures = fixtures.filter(f =>
    LIVE_STATUSES.includes(f.statusShort ?? '')
  );

  if (liveFixtures.length === 0) {
    console.log(`[sync-live] Nenhuma partida ao vivo no momento.`);
    return;
  }

  console.log(`[sync-live] ${liveFixtures.length} partida(s) ao vivo detectada(s).`);

  for (const fixture of liveFixtures) {
    try {
      // 1. Upsert do match principal (placar, minuto, status)
      const matchRow = mapFixtureToMatch(fixture);
      const { error: matchErr } = await supabase
        .from('matches')
        .upsert(matchRow, { onConflict: 'id' });
      if (matchErr) console.error(`[sync-live] Erro upsert match ${fixture.id}: ${matchErr.message}`);

      // 2. Eventos (gols, cartões, substituições)
      const events = await ZapScoreClient.getFixtureEvents(fixture.id);
      if (events.length > 0) {
        // Limpa eventos anteriores e reinsere (padrão do Supabase self-hosted)
        await supabase.from('fixture_events').delete().eq('fixture_id', fixture.externalId);
        const eventRows = events.map(e => mapEventToSupabase(e, fixture.externalId));
        const { error: evtErr } = await supabase.from('fixture_events').insert(eventRows);
        if (evtErr) console.error(`[sync-live] Erro inserir eventos ${fixture.id}: ${evtErr.message}`);
      }

      // 3. Estatísticas (JSONB por time)
      const stats = await ZapScoreClient.getFixtureStats(fixture.id);
      if (stats.length > 0) {
        const statRows = mapStatsToSupabase(stats, fixture.externalId);
        for (const row of statRows) {
          const { error: statErr } = await supabase
            .from('fixture_statistics')
            .upsert(row, { onConflict: 'fixture_id,team_api_id' });
          if (statErr) console.error(`[sync-live] Erro upsert stats ${fixture.id}: ${statErr.message}`);
        }
      }

      // 4. Escalações (JSONB por time — sincroniza apenas se ainda não tiver)
      const lineups = await ZapScoreClient.getFixtureLineups(fixture.id);
      if (lineups.length > 0) {
        const lineupRows = mapLineupsToSupabase(lineups, fixture.externalId);
        for (const row of lineupRows) {
          const { error: linErr } = await supabase
            .from('fixture_lineups')
            .upsert(row, { onConflict: 'fixture_id,team_api_id' });
          if (linErr) console.error(`[sync-live] Erro upsert lineups ${fixture.id}: ${linErr.message}`);
        }
      }

      // 5. Atualiza fixture_sync_control
      const syncCtrl = mapSyncControl(fixture, {
        core: true, events: events.length > 0,
        stats: stats.length > 0, lineups: lineups.length > 0,
        eventCount: events.length,
      });
      await supabase.from('fixture_sync_control')
        .upsert(syncCtrl, { onConflict: 'fixture_id' });

      console.log(`[sync-live] ✅ ${fixture.homeTeam?.name ?? fixture.homeTeamId} x ${fixture.awayTeam?.name ?? fixture.awayTeamId} — ${fixture.homeGoals ?? 0}-${fixture.awayGoals ?? 0} (${fixture.statusShort})`);
    } catch (err: any) {
      console.error(`[sync-live] Erro processando fixture ${fixture.id}: ${err.message}`);
    }
  }

  console.log(`[sync-live] Concluído.`);
}
