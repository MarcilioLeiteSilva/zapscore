import axios from 'axios';

const API_KEY = 'ac2466bba57666a7fa0dd153228f71d6';
const BASE_URL = 'https://v3.football.api-sports.io';

async function listRounds(leagueId: number, season: number) {
    console.log(`\n🔍 Buscando Rodadas para Liga ${leagueId} (${season})...`);
    try {
        const response = await axios.get(`${BASE_URL}/fixtures/rounds`, {
            headers: { 'x-apisports-key': API_KEY },
            params: { league: leagueId, season: season }
        });

        const rounds = response.data.response;
        console.log(`✅ Rodadas:`, rounds);
    } catch (error) {
        console.error('❌ Erro na API:', error.message);
    }
}

async function main() {
    await listRounds(73, 2026); // Copa do Brasil
    await listRounds(612, 2026); // Copa do Nordeste
    await listRounds(13, 2026); // Libertadores
    await listRounds(1, 2026); // World Cup
}

main();
