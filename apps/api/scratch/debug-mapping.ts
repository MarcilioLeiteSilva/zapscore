import axios from 'axios';
import { ApiFootballMapper } from '../src/integrations/api-football/mappers/api-football.mapper';

const API_KEY = 'ac2466bba57666a7fa0dd153228f71d6';
const API_FOOTBALL_URL = 'https://v3.football.api-sports.io/standings?league=1&season=2026';

async function main() {
    try {
        const res = await axios.get(API_FOOTBALL_URL, {
            headers: { 'x-apisports-key': API_KEY }
        });
        
        const standingsData = res.data?.response?.[0]?.league?.standings;
        if (!standingsData) {
            console.log('Nenhum dado de classificação.');
            return;
        }

        for (const group of standingsData) {
            for (const item of group) {
                if (item.team.name === 'South Korea') {
                    console.log('API Raw Item para South Korea:', JSON.stringify(item));
                    const mapped = ApiFootballMapper.toStanding(item, 'dummy-league-id', 'dummy-team-id', 2026);
                    console.log('Objeto Mapeado localmente para o Banco:', JSON.stringify(mapped));
                }
            }
        }
    } catch (e) {
        console.error('Erro:', e.message);
    }
}

main();
