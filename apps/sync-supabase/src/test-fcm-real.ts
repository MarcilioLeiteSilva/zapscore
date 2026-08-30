import { supabase } from './supabase-client';
import { sendMatchNotification } from './services/fcmService';

async function test() {
  console.log('🧪 Iniciando teste do FCM Service...');

  const { data: matches, error } = await supabase
    .from('matches')
    .select('id, home_team_id, away_team_id')
    .limit(1);

  if (error) { console.error('❌ Supabase:', error.message); return; }
  if (!matches?.length) { console.warn('⚠️ Nenhuma partida no Supabase.'); return; }

  const match = matches[0];
  console.log(`📌 Partida UUID: ${match.id}`);

  await sendMatchNotification(supabase, {
    type: 'GOAL',
    matchUuid: match.id,
    homeTeamUuid: match.home_team_id,
    awayTeamUuid: match.away_team_id,
    homeTeamName: 'Time Teste A',
    awayTeamName: 'Time Teste B',
    homeScore: 1,
    awayScore: 0,
    playerName: 'Jogador Teste',
    minute: 45,
    goalTeamName: 'Time Teste A'
  });

  console.log('🧪 Teste finalizado.');
}

test().catch(console.error);
