import axios from 'axios';

const API_KEY = 'ac2466bba57666a7fa0dd153228f71d6';
const API_FOOTBALL_URL = 'https://v3.football.api-sports.io/fixtures?league=612&season=2024&live=all';

async function main() {
    try {
        console.log('Fetching live fixtures for Copa do Nordeste...');
        let res = await axios.get(API_FOOTBALL_URL, {
            headers: { 'x-apisports-key': API_KEY }
        });
        
        if (!res.data || !res.data.response || res.data.response.length === 0) {
            console.log('No live fixtures right now. Fetching next fixture...');
            res = await axios.get('https://v3.football.api-sports.io/fixtures?league=612&season=2024&next=1', {
                headers: { 'x-apisports-key': API_KEY }
            });
        }

        const fixtures = res.data?.response;
        if (!fixtures || fixtures.length === 0) {
            console.log('Nenhuma partida encontrada.');
            return;
        }

        const fixture = fixtures[0];
        console.log('Match:', fixture.teams.home.name, 'vs', fixture.teams.away.name);
        console.log('Status:', fixture.fixture.status.short);
        
        console.log('Checking lineups for fixture ID:', fixture.fixture.id);
        const lineupsRes = await axios.get(`https://v3.football.api-sports.io/fixtures/lineups?fixture=${fixture.fixture.id}`, {
            headers: { 'x-apisports-key': API_KEY }
        });

        const lineups = lineupsRes.data?.response;
        if (!lineups || lineups.length === 0) {
            console.log('Escalação NÃO atualizada ainda na API-Football.');
        } else {
            console.log('Escalação ATUALIZADA na API-Football! Tem dados para:', lineups.map((l: any) => l.team.name).join(' e '));
        }

    } catch (e) {
        console.error('Erro:', e.message);
    }
}

main();
