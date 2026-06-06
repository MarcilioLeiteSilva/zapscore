import axios from 'axios';

const API_BASE = 'https://zapscore-zapscore-api.gtalg3.easypanel.host';

async function main() {
    console.log('🏁 Iniciando Sincronização da Copa do Mundo 2026 (ID 1) em Produção...');
    try {
        const response = await axios.post(`${API_BASE}/sync/bootstrap`, {
            leagueId: 1,
            season: 2026
        }, { timeout: 600000 }); // 10 minutos de timeout
        console.log('✅ Copa do Mundo 2026 sincronizada com sucesso!', response.data);
    } catch (error) {
        console.error('❌ Erro ao sincronizar a Copa do Mundo 2026:', error.response?.data || error.message);
    }
}

main();
