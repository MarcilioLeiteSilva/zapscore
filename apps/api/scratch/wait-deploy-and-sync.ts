import axios from 'axios';

const API_BASE = 'https://zapscore-zapscore-api.gtalg3.easypanel.host';

async function waitApiOnline() {
    console.log('🔄 Aguardando a API voltar a ficar online...');
    for (let i = 0; i < 30; i++) { // tentar por 5 minutos
        try {
            const res = await axios.get(`${API_BASE}/version`);
            console.log(`✅ API Online! Versão: ${JSON.stringify(res.data)}`);
            return true;
        } catch (e) {
            console.log(`... API offline ou buildando ainda (tentativa ${i+1}/30)`);
            await new Promise(r => setTimeout(r, 10000)); // esperar 10 segundos
        }
    }
    return false;
}

async function triggerSync() {
    console.log('\n🔄 Iniciando re-sincronização da Copa do Mundo 2026 (ID 1) com o novo mapper...');
    try {
        const res = await axios.post(`${API_BASE}/sync/bootstrap`, {
            leagueId: 1,
            season: 2026
        }, { timeout: 600000 });
        console.log('✅ Sincronização concluída com sucesso!');
    } catch (error) {
        console.error('❌ Erro durante a sincronização:', error.response?.data || error.message);
    }
}

async function compareResults() {
    console.log('\n📊 Comparando classificação após a atualização...');
    try {
        const dbResponse = await axios.get(`${API_BASE}/standings?leagueId=1&season=2026`);
        const dbStandings = dbResponse.data;
        if (!dbStandings || dbStandings.length === 0) {
            console.log('⚠️ Nenhuma classificação encontrada no banco.');
            return;
        }

        console.log(`✅ Total de registros no banco: ${dbStandings.length}`);
        console.log('Classificação atual no banco de dados (primeiros 10 times):');
        dbStandings.slice(0, 10).forEach((item: any) => {
            console.log(`- Rank ${item.rank}: ${item.team.name} (Pts: ${item.points}, J: ${item.played}, GP: ${item.goalsFor}, GC: ${item.goalsAgainst}, SG: ${item.goalsDiff})`);
        });
    } catch (error) {
        console.error('❌ Erro ao ler classificação:', error.message);
    }
}

async function main() {
    const online = await waitApiOnline();
    if (online) {
        await triggerSync();
        await compareResults();
    } else {
        console.error('❌ API não ficou online a tempo.');
    }
}

main();
