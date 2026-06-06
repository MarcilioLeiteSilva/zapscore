import axios from 'axios';

const ZAPSCORE_API_URL = 'https://zapscore-zapscore-api.gtalg3.easypanel.host/standings?season=2026';

async function main() {
    try {
        console.log('📥 Buscando todos os standings da temporada 2026...');
        const res = await axios.get(ZAPSCORE_API_URL);
        const allStandings = res.data;
        console.log(`Total de registros retornados: ${allStandings.length}`);

        // Filtrar apenas os da Copa do Mundo (League ID 1 ou nome "Copa do Mundo FIFA")
        const worldCupStandings = allStandings.filter((item: any) => item.league?.externalId === 1 || item.leagueId === 'Copa do Mundo FIFA');
        console.log(`Registros da Copa do Mundo encontrados: ${worldCupStandings.length}`);

        const targets = ['Mexico', 'South Africa', 'South Korea', 'Canada', 'Bosnia & Herzegovina'];
        targets.forEach(tName => {
            const found = worldCupStandings.find((item: any) => item.team.name === tName);
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
        console.error('Erro:', e.message);
    }
}

main();
