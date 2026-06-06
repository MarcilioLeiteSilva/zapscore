import axios from 'axios';

const ZAPSCORE_API_URL = 'https://zapscore-zapscore-api.gtalg3.easypanel.host/standings?leagueId=1&season=2026';

async function main() {
    try {
        const res = await axios.get(ZAPSCORE_API_URL);
        const standings = res.data;
        console.log(`Registros retornados pela API local: ${standings.length}`);
        
        // Filtrar alguns times específicos
        const targets = ['Mexico', 'South Africa', 'South Korea', 'Canada', 'Bosnia & Herzegovina'];
        targets.forEach(tName => {
            const found = standings.find((item: any) => item.team.name === tName);
            if (found) {
                console.log(JSON.stringify({
                    team: found.team.name,
                    rank: found.rank,
                    points: found.points,
                    played: found.played,
                    win: found.win,
                    draw: found.draw,
                    lose: found.lose,
                    goalsFor: found.goalsFor,
                    goalsAgainst: found.goalsAgainst,
                    goalsDiff: found.goalsDiff
                }));
            } else {
                console.log(`Time "${tName}" não encontrado no banco.`);
            }
        });
    } catch (e) {
        console.error('Erro:', e.message);
    }
}

main();
