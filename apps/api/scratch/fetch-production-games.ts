import axios from 'axios';

const API_BASE = 'https://zapscore-zapscore-api.gtalg3.easypanel.host';

async function main() {
  try {
    console.log(`Buscando fixtures de hoje do endpoint ${API_BASE}/fixtures/today...`);
    const todayRes = await axios.get(`${API_BASE}/fixtures/today`);
    const todayFixtures = todayRes.data;
    
    console.log(`Total de fixtures de hoje: ${todayFixtures.length}`);

    // Separando jogos ao vivo e terminados ou agendados
    const live = todayFixtures.filter((f: any) => 
      ['1H', '2H', 'HT', 'ET', 'P', 'BT', 'LIVE'].includes(f.statusShort)
    );
    const finished = todayFixtures.filter((f: any) => 
      ['FT', 'AET', 'PEN'].includes(f.statusShort)
    );
    const scheduled = todayFixtures.filter((f: any) => 
      !['1H', '2H', 'HT', 'ET', 'P', 'BT', 'LIVE', 'FT', 'AET', 'PEN'].includes(f.statusShort)
    );

    console.log(`\n--- JOGOS AO VIVO AGORA (${live.length}) ---`);
    live.forEach((f: any) => {
      console.log(`[${f.league?.name || 'Liga'}] ${f.homeTeam?.name} ${f.homeGoals ?? 0} - ${f.awayGoals ?? 0} ${f.awayTeam?.name} (${f.elapsed}', Status: ${f.statusShort})`);
    });

    console.log(`\n--- JOGOS ENCERRADOS HOJE (${finished.length}) ---`);
    finished.forEach((f: any) => {
      console.log(`[${f.league?.name || 'Liga'}] ${f.homeTeam?.name} ${f.homeGoals ?? 0} - ${f.awayGoals ?? 0} ${f.awayTeam?.name} (Finalizado - ${f.statusShort})`);
    });

    console.log(`\n--- JOGOS AGENDADOS / OUTROS (${scheduled.length}) ---`);
    scheduled.forEach((f: any) => {
      console.log(`[${f.league?.name || 'Liga'}] ${f.homeTeam?.name} vs ${f.awayTeam?.name} (Status: ${f.statusShort}, Hora: ${f.date})`);
    });

  } catch (err) {
    console.error('Erro ao buscar dados da API de produção:', err.message);
    
    // Se falhar o /today, vamos tentar o /fixtures geral
    try {
      console.log(`Tentando buscar de ${API_BASE}/fixtures...`);
      const res = await axios.get(`${API_BASE}/fixtures?limit=500`);
      console.log(`Recebidos ${res.data?.length || 0} fixtures do /fixtures`);
      // Exibe os primeiros 10
      const fixtures = res.data || [];
      fixtures.slice(0, 15).forEach((f: any) => {
        console.log(`[${f.league?.name || 'Liga'}] ${f.homeTeam?.name} ${f.homeGoals ?? 0} - ${f.awayGoals ?? 0} ${f.awayTeam?.name} (Status: ${f.statusShort}, Data: ${f.date})`);
      });
    } catch (e2) {
      console.error('Erro secundário ao buscar /fixtures:', e2.message);
    }
  }
}

main();
