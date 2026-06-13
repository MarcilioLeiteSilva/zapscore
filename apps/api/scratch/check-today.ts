import axios from 'axios';

const API_KEY = 'ac2466bba57666a7fa0dd153228f71d6';

async function main() {
    try {
        console.log('Fetching fixtures for Copa do Nordeste (612) season 2026...');
        const res = await axios.get('https://v3.football.api-sports.io/fixtures?league=612&season=2026', {
            headers: { 'x-apisports-key': API_KEY }
        });
        
        const fixtures = res.data?.response;
        if (!fixtures || fixtures.length === 0) {
            console.log('Nenhuma partida encontrada para a temporada 2026.');
            return;
        }

        // Find the next/latest match
        const match = fixtures[fixtures.length - 1]; // usually the last one is the latest or we can sort by date
        console.log('Match:', match.teams.home.name, 'vs', match.teams.away.name);
        console.log('Status:', match.fixture.status.short, '-', match.fixture.date);
        
        console.log('Checking lineups for fixture ID:', match.fixture.id);
        const lineupsRes = await axios.get(`https://v3.football.api-sports.io/fixtures/lineups?fixture=${match.fixture.id}`, {
            headers: { 'x-apisports-key': API_KEY }
        });

        const lineups = lineupsRes.data?.response;
        if (!lineups || lineups.length === 0) {
            console.log('Escalação NÃO disponível na API-Football.');
        } else {
            console.log('Escalação ATUALIZADA na API! Tem dados para:', lineups.map((l: any) => l.team.name).join(' e '));
        }

    } catch (e) {
        console.error('Erro:', e.message);
    }
}

main();
