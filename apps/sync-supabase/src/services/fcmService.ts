import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
import { SupabaseClient } from '@supabase/supabase-js';

// Inicialização do SDK Admin usando variáveis de ambiente individuais
let isFirebaseInitialized = false;

if (getApps().length === 0) {
  const projectId   = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  // O EasyPanel armazena \n como literal; convertemos para quebra de linha real
  const privateKey  = process.env.FIREBASE_PRIVATE_KEY
    ?.replace(/^"|"$/g, '') // remove aspas extras se houver
    ?.replace(/\\n/g, '\n');

  if (!projectId || !clientEmail || !privateKey) {
    console.warn('⚠️ [FCM] Variáveis FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL ou FIREBASE_PRIVATE_KEY não configuradas. Notificações desabilitadas.');
  } else {
    try {
      initializeApp({
        credential: cert({ projectId, clientEmail, privateKey })
      });
      isFirebaseInitialized = true;
      console.log('📡 [FCM] Firebase Admin SDK inicializado com sucesso.');
    } catch (error) {
      console.error('❌ [FCM] Erro ao inicializar o Firebase Admin:', error);
    }
  }
} else {
  isFirebaseInitialized = true;
}

export interface NotificationPayload {
  type: 'MATCH_START' | 'GOAL' | 'MATCH_END';
  matchUuid: string;
  homeTeamUuid: string;
  awayTeamUuid: string;
  homeTeamName: string;
  awayTeamName: string;
  homeScore: number;
  awayScore: number;
  playerName?: string;
  minute?: number;
  goalTeamName?: string;
}

/**
 * Busca destinatários elegíveis no Supabase e envia a notificação Multicast
 */
export async function sendMatchNotification(supabase: SupabaseClient, payload: NotificationPayload) {
  if (!isFirebaseInitialized) {
    console.warn('⚠️ [FCM] Firebase Admin não inicializado. Notificação não enviada.');
    return;
  }

  const {
    type,
    matchUuid,
    homeTeamUuid,
    awayTeamUuid,
    homeTeamName,
    awayTeamName,
    homeScore,
    awayScore,
    playerName,
    minute,
    goalTeamName
  } = payload;

  try {
    // 1. Buscar perfis ativos (com notificações habilitadas e FCM token preenchido)
    const { data: profiles, error: pErr } = await supabase
      .from('user_profiles')
      .select('id, fcm_token, favorite_team_id')
      .eq('notifications_enabled', true)
      .not('fcm_token', 'is', null);

    if (pErr) {
      console.error('❌ [FCM] Erro ao buscar perfis de usuários no Supabase:', pErr.message);
      return;
    }
    if (!profiles || profiles.length === 0) {
      console.log('📡 [FCM] Nenhum usuário ativo com FCM token cadastrado no Supabase.');
      return;
    }

    const isGlobalNotification = type === 'MATCH_START' || type === 'MATCH_END';

    let usersWhoFavoritedTeams = new Set<string>();
    let usersWhoFavoritedMatch = new Set<string>();
    let teamIdsToSearch: string[] = [homeTeamUuid, awayTeamUuid];

    if (!isGlobalNotification) {
      // Obter também os external_id numéricos dos times em campo para checagem em memória
      const { data: teamsData } = await supabase
        .from('teams')
        .select('id, external_id')
        .in('id', [homeTeamUuid, awayTeamUuid]);

      if (teamsData) {
        teamsData.forEach(t => {
          if (t.external_id && !teamIdsToSearch.includes(t.external_id)) {
            teamIdsToSearch.push(t.external_id);
          }
        });
      }

      // Filtrar apenas UUIDs válidos para consulta no Postgres na tabela user_favorite_teams
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const validUuidTeamIds = teamIdsToSearch.filter(id => typeof id === 'string' && uuidRegex.test(id));

      // 2. Buscar favoritos de times em campo (apenas com UUIDs válidos)
      if (validUuidTeamIds.length > 0) {
        const { data: favTeams, error: tErr } = await supabase
          .from('user_favorite_teams')
          .select('user_id, team_id')
          .in('team_id', validUuidTeamIds);

        if (tErr) {
          console.error('❌ [FCM] Erro ao buscar times favoritos no Supabase:', tErr.message);
        } else if (favTeams) {
          usersWhoFavoritedTeams = new Set(favTeams.map(ft => ft.user_id));
        }
      }

      // 3. Buscar favoritos desta partida específica
      if (uuidRegex.test(matchUuid)) {
        const { data: favMatches, error: mErr } = await supabase
          .from('user_favorite_matches')
          .select('user_id')
          .eq('match_id', matchUuid);

        if (mErr) {
          console.error('❌ [FCM] Erro ao buscar partidas favoritas no Supabase:', mErr.message);
        } else if (favMatches) {
          usersWhoFavoritedMatch = new Set(favMatches.map(fm => fm.user_id));
        }
      }
    }

    const targetTokens: string[] = [];
    const logsToInsert: any[] = [];

    // Definir título e corpo com base no tipo de notificação
    let title = '';
    let body = '';

    if (type === 'MATCH_START') {
      title = '🟢 Partida Iniciada!';
      body = `Bola rolando para ${homeTeamName} x ${awayTeamName}`;
    } else if (type === 'GOAL') {
      title = `⚽ GOL do ${goalTeamName || 'Time'}!`;
      body = `${homeTeamName} ${homeScore} x ${awayScore} ${awayTeamName} (${playerName || 'Jogador'} ${minute || 0}')`;
    } else if (type === 'MATCH_END') {
      title = '🔴 Fim de Jogo!';
      body = `Placar final: ${homeTeamName} ${homeScore} x ${awayScore} ${awayTeamName}`;
    }

    for (const profile of profiles) {
      const isProfileFav = profile.favorite_team_id != null && teamIdsToSearch.includes(profile.favorite_team_id);
      const hasTeamFav = usersWhoFavoritedTeams.has(profile.id);
      const hasMatchFav = usersWhoFavoritedMatch.has(profile.id);

      if (isGlobalNotification || isProfileFav || hasTeamFav || hasMatchFav) {
        targetTokens.push(profile.fcm_token);
        logsToInsert.push({
          user_id: profile.id,
          match_id: matchUuid,
          type: type,
          title: title,
          body: body,
          payload_json: { match_id: matchUuid, type: type }
        });
      }
    }

    if (targetTokens.length === 0) {
      console.log(`📡 [FCM] Nenhum destinatário elegível encontrado para o evento ${type}. Notificação não enviada.`);
      return;
    }

    // Remover tokens duplicados
    const uniqueTokens = Array.from(new Set(targetTokens));

    // 4. Enviar notificação via Firebase com alta prioridade e canal Android
    const message = {
      notification: {
        title: title,
        body: body,
      },
      android: {
        priority: 'high' as const,
        notification: {
          channelId: 'futebol_gols_channel',
          sound: 'default',
          priority: 'high' as const,
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            contentAvailable: true,
          },
        },
      },
      data: {
        match_id: matchUuid,
        type: type,
      },
      tokens: uniqueTokens,
    };

    console.log(`📡 [FCM] Enviando push multicast de ${type} para ${uniqueTokens.length} dispositivo(s)...`);
    const response = await getMessaging().sendEachForMulticast(message);
    console.log(`📡 [FCM] Envio concluído (${type}). Sucesso: ${response.successCount} | Falha: ${response.failureCount}`);

    // 5. Inserir logs na tabela notification_logs
    if (logsToInsert.length > 0) {
      const { error: insertErr } = await supabase.from('notification_logs').insert(logsToInsert);
      if (insertErr) {
        console.error('❌ [FCM] Erro ao inserir logs na tabela notification_logs:', insertErr.message);
      }
    }
  } catch (err: any) {
    console.error('❌ [FCM] Erro durante o fluxo de disparo de pushes:', err.message);
  }
}
