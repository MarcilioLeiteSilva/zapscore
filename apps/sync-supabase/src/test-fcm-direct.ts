import { supabase } from './supabase-client';
import { getMessaging } from 'firebase-admin/messaging';
import './services/fcmService'; // Garante inicialização do Firebase Admin

async function testDirect() {
  console.log('🧪 Iniciando teste FCM direto...');

  // Busca perfis ativos que possuem token
  const { data: profiles, error } = await supabase
    .from('user_profiles')
    .select('id, full_name, fcm_token, notifications_enabled')
    .eq('notifications_enabled', true)
    .not('fcm_token', 'is', null)
    .limit(5);

  if (error) {
    console.error('❌ Erro ao buscar perfis no Supabase:', error.message);
    return;
  }

  if (!profiles || profiles.length === 0) {
    console.warn('⚠️ Nenhum perfil com token ativo e notificações ligadas foi encontrado.');
    return;
  }

  // Pega o primeiro perfil para teste
  const profile = profiles[0];
  console.log(`📌 Destinatário: ${profile.full_name} | ID: ${profile.id}`);
  console.log(`🔑 Token FCM: ${profile.fcm_token.substring(0, 20)}...`);

  const message = {
    notification: {
      title: '⚽ GOL da Rodada! (Teste Direto)',
      body: 'Gooool! Este é um teste real de push disparado pelo console do ZapScore!',
    },
    data: {
      match_id: 'test-match-uuid',
      type: 'GOAL',
    },
    token: profile.fcm_token,
  };

  try {
    const response = await getMessaging().send(message);
    console.log('✅ Notificação enviada com sucesso! ID de retorno:', response);
  } catch (err: any) {
    console.error('❌ Erro no envio:', err.message);
  }
}

testDirect().catch(console.error);
