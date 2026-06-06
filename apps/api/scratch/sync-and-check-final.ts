import axios from 'axios';

const API_BASE = 'https://zapscore-zapscore-api.gtalg3.easypanel.host';

async function main() {
    console.log('🔄 Disparando sincronização final para atualizar o banco com o novo código...');
    try {
        await axios.post(`${API_BASE}/sync/bootstrap`, {
            leagueId: 1,
            season: 2026
        }, { timeout: 600000 });
        console.log('✅ Sincronização concluída!');

        console.log('\n📥 Buscando dados de classificação atualizados...');
        const res = await axios.get(`${API_BASE}/standings?leagueId=1&season=2026`);
        const standings = res.data;
        
        console.log(`Total de registros no banco: ${standings.length}`);
        
        // Exibir alguns times específicos para conferir o rank e gols
        const targets = ['Mexico', 'South Africa', 'South Korea', 'Canada', 'Bosnia & Herzegovina'];
        targets.forEach(tName => {
            const found = standings.find((item: any) => item.team.name === tName);
            if (found) {
                console.log(JSON.stringify({
                    team: found.team.name,
                    rank: found.rank,
                    points: found.points,
                    played: found.played,
                    goalsFor: found.goalsFor,
                    goalsAgainst: found.goalsAgainst,
                    goalsDiff: found.goalsDiff
                }));
            }
        });
    } catch (e) {
        console.error('❌ Erro:', e.message);
    }
}

main();
