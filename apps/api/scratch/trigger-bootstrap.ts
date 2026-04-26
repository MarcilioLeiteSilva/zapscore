import axios from 'axios';

const API_BASE = 'https://zapscore-zapscore-api.gtalg3.easypanel.host'; 
const LEAGUES = [71, 72, 73, 612, 1, 13];

async function triggerSync(id: number) {
    console.log(`\n⏳ Solicitando Carga para Liga ${id} em Produção...`);
    try {
        const response = await axios.post(`${API_BASE}/sync/bootstrap`, {
            leagueId: id,
            season: 2026
        }, { timeout: 600000 }); // 10 minutos de timeout para o servidor remoto
        console.log(`✅ Liga ${id} processada com sucesso!`);
    } catch (error) {
        console.error(`❌ Erro na Liga ${id}:`, error.response?.data || error.message);
    }
}

async function main() {
    console.log('🏁 Iniciando Chamadas de Sincronização...');
    for (const id of LEAGUES) {
        await triggerSync(id);
    }
    console.log('\n✨ Todas as ordens de sincronização foram enviadas!');
}

main();
