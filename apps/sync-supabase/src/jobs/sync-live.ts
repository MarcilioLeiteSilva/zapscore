import { ZapScoreClient } from '../zapscore-client';
import { supabase } from '../supabase-client';
import {
  mapFixtureToMatch,
  mapEventToSupabase,
  mapStatsToSupabase,
  mapLineupsToSupabase,
  mapSyncControl,
} from '../mappers';
import { sendMatchNotification } from '../services/fcmService';

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

  // Busca partidas marcadas como LIVE no banco de dados para capturar a transição para encerrado (FT)
  let dbLiveIds = new Set<string>();
  try {
    const { data: dbLiveMatches } = await supabase
      .from('matches')
      .select('external_id')
      .eq('status', 'LIVE');
    if (dbLiveMatches) {
      dbLiveMatches.forEach(m => {
        if (m.external_id) dbLiveIds.add(String(m.external_id));
      });
    }
  } catch (dbErr: any) {
    console.error(`[sync-live] Erro ao buscar partidas LIVE no banco: ${dbErr.message}`);
  }

  // Filtra partidas ao vivo, em transição ou recém-finalizadas
  const FINISHED_STATUSES = ['FT','AET','PEN'];
  const liveFixtures = fixtures.filter(f =>
    LIVE_STATUSES.includes(f.statusShort ?? '') ||
    FINISHED_STATUSES.includes(f.statusShort ?? '') ||
    dbLiveIds.has(String(f.externalId))
  );

  if (liveFixtures.length === 0) {
    console.log(`[sync-live] Nenhuma partida ao vivo ou recém-finalizada no momento.`);
    return;
  }

  console.log(`[sync-live] ${liveFixtures.length} partida(s) em processamento (live/transição/fim).`);

  for (const fixture of liveFixtures) {
    try {
      // 1. Busca o registro de sync control para usar como flag de notificação
      const { data: syncCtrlData } = await supabase
        .from('fixture_sync_control')
        .select('match_id, match_start_notified, match_end_notified')
        .eq('fixture_id', fixture.externalId)
        .maybeSingle();

      const matchRow = mapFixtureToMatch(fixture);
      // Usa o UUID real do banco se disponível
      if (syncCtrlData?.match_id) {
        matchRow.id = syncCtrlData.match_id;
      }

      const { error: matchErr } = await supabase
        .from('matches')
        .upsert(matchRow, { onConflict: 'id' });
      if (matchErr) console.error(`[sync-live] Erro upsert match ${fixture.id}: ${matchErr.message}`);

      // Notificação de Início de Partida (MATCH_START)
      const isNowLive = LIVE_STATUSES.includes(fixture.statusShort ?? '');
      if (isNowLive && !syncCtrlData?.match_start_notified) {
        console.log(`🟢 [sync-live] Partida iniciada: ${fixture.homeTeam?.name ?? 'Time A'} x ${fixture.awayTeam?.name ?? 'Time B'} - Disparando notificação...`);
        await supabase
          .from('fixture_sync_control')
          .update({ match_start_notified: true })
          .eq('fixture_id', fixture.externalId);
        sendMatchNotification(supabase, {
          type: 'MATCH_START',
          matchUuid: matchRow.id,
          homeTeamUuid: matchRow.home_team_id,
          awayTeamUuid: matchRow.away_team_id,
          homeTeamName: fixture.homeTeam?.name ?? 'Time da Casa',
          awayTeamName: fixture.awayTeam?.name ?? 'Time Visitante',
          homeScore: fixture.homeGoals ?? 0,
          awayScore: fixture.awayGoals ?? 0,
        }).catch(err => console.error("❌ [FCM] Erro ao disparar notificação MATCH_START:", err));
      }

      // Notificação de Fim de Partida (MATCH_END)
      const isNowFinished = FINISHED_STATUSES.includes(fixture.statusShort ?? '');
      if (isNowFinished && !syncCtrlData?.match_end_notified) {
        console.log(`🔴 [sync-live] Partida finalizada: ${fixture.homeTeam?.name ?? 'Time A'} x ${fixture.awayTeam?.name ?? 'Time B'} - Disparando notificação...`);
        await supabase
          .from('fixture_sync_control')
          .update({ match_end_notified: true })
          .eq('fixture_id', fixture.externalId);
        sendMatchNotification(supabase, {
          type: 'MATCH_END',
          matchUuid: matchRow.id,
          homeTeamUuid: matchRow.home_team_id,
          awayTeamUuid: matchRow.away_team_id,
          homeTeamName: fixture.homeTeam?.name ?? 'Time da Casa',
          awayTeamName: fixture.awayTeam?.name ?? 'Time Visitante',
          homeScore: fixture.homeGoals ?? 0,
          awayScore: fixture.awayGoals ?? 0,
        }).catch(err => console.error("❌ [FCM] Erro ao disparar notificação MATCH_END:", err));
      }

      // 2. Eventos (gols, cartões, substituições)
      const events = await ZapScoreClient.getFixtureEvents(fixture.id);
      if (events.length > 0) {
        // Buscar gols existentes no banco antes da deleção para saber quais são novos
        let existingGoals: any[] = [];
        try {
          const { data, error } = await supabase
            .from('fixture_events')
            .select('minute, player_name')
            .eq('fixture_id', fixture.externalId)
            .eq('type', 'Goal');
          if (!error && data) {
            existingGoals = data;
          }
        } catch (evtSearchErr: any) {
          console.error(`[sync-live] Erro ao buscar gols antigos para fixture ${fixture.id}:`, evtSearchErr.message);
        }

        // Limpa eventos anteriores e reinsere (padrão do Supabase self-hosted)
        await supabase.from('fixture_events').delete().eq('fixture_id', fixture.externalId);
        const eventRows = events.map(e => mapEventToSupabase(e, fixture.externalId));
        const { error: evtErr } = await supabase.from('fixture_events').insert(eventRows);
        if (evtErr) {
          console.error(`[sync-live] Erro inserir eventos ${fixture.id}: ${evtErr.message}`);
        } else {
          // Identificar e notificar novos gols
          const apiGoals = events.filter(e => e.type === 'Goal');
          for (const apiGoal of apiGoals) {
            const minute = apiGoal.time;
            const playerName = apiGoal.player;

            const alreadyExists = existingGoals.some(
              eg => eg.minute === minute && eg.player_name === playerName
            );

            if (!alreadyExists) {
              const goalTeamName = (apiGoal.teamId === fixture.homeTeamId || apiGoal.teamId === fixture.homeTeam?.id)
                ? (fixture.homeTeam?.name ?? 'Time da Casa')
                : (fixture.awayTeam?.name ?? 'Time Visitante');

              console.log(`⚽ [sync-live] Novo gol detectado: ${playerName} (${minute}') - Disparando notificação...`);
              sendMatchNotification(supabase, {
                type: 'GOAL',
                matchUuid: matchRow.id,
                homeTeamUuid: matchRow.home_team_id,
                awayTeamUuid: matchRow.away_team_id,
                homeTeamName: fixture.homeTeam?.name ?? 'Time da Casa',
                awayTeamName: fixture.awayTeam?.name ?? 'Time Visitante',
                homeScore: fixture.homeGoals ?? 0,
                awayScore: fixture.awayGoals ?? 0,
                playerName: playerName ?? 'Jogador Desconhecido',
                minute: minute,
                goalTeamName: goalTeamName
              }).catch(err => console.error("❌ [FCM] Erro ao disparar notificação GOAL:", err));
            }
          }
        }
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
