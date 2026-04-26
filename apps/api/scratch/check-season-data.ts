import axios from 'axios';

const API_KEY = 'ac2466bba57666a7fa0dd153228f71d6';
const BASE_URL = 'https://v3.football.api-sports.io';

async function checkSeason(leagueId: number, season: number) {
    console.log(`\n🔍 Verificando Liga ${leagueId} Temporada ${season}...`);
    try {
        const response = await axios.get(`${BASE_URL}/fixtures`, {
            headers: { 'x-apisports-key': API_KEY },
            params: { league: leagueId, season: season }
        });
        console.log(`📊 Total de jogos encontrados: ${response.data.results}`);
    } catch (error) {
        console.error('❌ Erro:', error.message);
    }
}

async function main() {
    await checkSeason(612, 2026); // Copa do Nordeste
    await checkSeason(1, 2026);   // World Cup
    await checkSeason(13, 2026);  // Libertadores
    await checkSeason(71, 2026);  // Serie A
}

main();
