import axios from 'axios';

const API_KEY = 'ac2466bba57666a7fa0dd153228f71d6';
const API_FOOTBALL_URL = 'https://v3.football.api-sports.io/standings?league=1&season=2026';

async function main() {
    try {
        const res = await axios.get(API_FOOTBALL_URL, {
            headers: { 'x-apisports-key': API_KEY }
        });
        
        const standings = res.data?.response?.[0]?.league?.standings;
        if (!standings) {
            console.log('Nenhum dado de classificação.');
            return;
        }

        console.log(`Grupos retornados: ${standings.length}`);
        // Imprimir os primeiros 2 grupos completos
        for (let i = 0; i < Math.min(standings.length, 2); i++) {
            console.log(`\n=== GRUPO ${i + 1} ===`);
            standings[i].forEach((item: any) => {
                console.log(JSON.stringify({
                    rank: item.rank,
                    team: item.team.name,
                    teamId: item.team.id,
                    group: item.group,
                    points: item.points,
                    goalsFor: item.all?.goals?.for,
                    goalsAgainst: item.all?.goals?.against,
                    goalsDiff: item.goalsDiff
                }));
            });
        }
    } catch (e) {
        console.error('Erro:', e.message);
    }
}

main();
