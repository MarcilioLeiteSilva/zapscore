import axios from 'axios';

const API_BASE = 'https://zapscore-zapscore-api.gtalg3.easypanel.host';

async function main() {
  try {
    const todayRes = await axios.get(`${API_BASE}/fixtures/today`);
    const todayFixtures = todayRes.data;
    
    const match = todayFixtures.find((f: any) => 
      (f.homeTeam?.name?.includes('Qatar') || f.awayTeam?.name?.includes('Qatar'))
    );

    if (!match) {
      console.log('Partida Catar x Suíça não encontrada no endpoint /fixtures/today.');
      return;
    }

    console.log(`\n=== DADOS GERAIS DO JOGO DE HOJE ===`);
    console.log(`ID do Jogo (db/internal): ${match.id}`);
    console.log(`ID Externo (API-Football): ${match.externalId}`);
    console.log(`Partida: ${match.homeTeam?.name} ${match.homeGoals ?? 0} x ${match.awayGoals ?? 0} ${match.awayTeam?.name}`);
    console.log(`Tempo: ${match.elapsed}' (Status: ${match.statusShort} - ${match.statusLong})`);
    console.log(`Última Atualização no Banco: ${match.updatedAt}`);

    // Buscar detalhes do jogo (eventos, estatísticas, escalações)
    console.log(`\nBuscando detalhes do jogo do endpoint ${API_BASE}/fixtures/${match.id}...`);
    const detailRes = await axios.get(`${API_BASE}/fixtures/${match.id}`);
    const details = detailRes.data;

    console.log(`\n=== EVENTOS DO JOGO (${details.events?.length || 0}) ===`);
    if (details.events && details.events.length > 0) {
      details.events.forEach((ev: any) => {
        console.log(`- [${ev.time}'] [${ev.type} - ${ev.detail}] ${ev.player} ${ev.assist ? `(Assist: ${ev.assist})` : ''} - Time ID: ${ev.teamId}`);
      });
    } else {
      console.log('Nenhum evento registrado ainda.');
    }

    console.log(`\n=== ESTATÍSTICAS DO JOGO (${details.stats?.length || 0}) ===`);
    if (details.stats && details.stats.length > 0) {
      // Agrupar estatísticas por tipo
      const statsMap: Record<string, { home: string, away: string }> = {};
      details.stats.forEach((st: any) => {
        if (!statsMap[st.type]) {
          statsMap[st.type] = { home: '-', away: '-' };
        }
        if (st.teamId === match.homeTeam.externalId) {
          statsMap[st.type].home = st.value;
        } else {
          statsMap[st.type].away = st.value;
        }
      });
      console.table(statsMap);
    } else {
      console.log('Nenhuma estatística registrada ainda.');
    }

  } catch (err) {
    console.error('Erro ao buscar dados:', err.message);
  }
}

main();
