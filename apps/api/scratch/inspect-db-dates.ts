import axios from 'axios';

const ZAPSCORE_API_URL = 'https://zapscore-zapscore-api.gtalg3.easypanel.host/standings?leagueId=1&season=2026';

async function main() {
    try {
        const res = await axios.get(ZAPSCORE_API_URL);
        const standings = res.data;
        
        const targets = ['Mexico', 'South Africa', 'South Korea'];
        targets.forEach(tName => {
            const found = standings.find((item: any) => item.team.name === tName);
            if (found) {
                console.log(`${found.team.name}: Rank=${found.rank}, CreatedAt=${found.createdAt}, UpdatedAt=${found.updatedAt}`);
            }
        });
    } catch (e) {
        console.error('Erro:', e.message);
    }
}

main();
