import axios from 'axios';

const API_KEY = 'ac2466bba57666a7fa0dd153228f71d6';
const API_FOOTBALL_URL = 'https://v3.football.api-sports.io/standings?league=1&season=2026';
const ZAPSCORE_API_URL = 'https://zapscore-zapscore-api.gtalg3.easypanel.host/standings?leagueId=1&season=2026';

async function main() {
    console.log('🔄 Comparando dados da Copa do Mundo 2026 (ID 1)...');
    
    try {
        // 1. Buscar da API-Football
        console.log('\n📥 Buscando dados da API-Football...');
        const apiResponse = await axios.get(API_FOOTBALL_URL, {
            headers: { 'x-apisports-key': API_KEY }
        });
        
        const apiStandingsData = apiResponse.data?.response?.[0]?.league?.standings;
        if (!apiStandingsData) {
            console.log('⚠️ Nenhum dado de classificação retornado pela API-Football para a Copa 2026.');
        } else {
            console.log(`✅ API-Football retornou ${apiStandingsData.length} grupos.`);
            const firstGroup = apiStandingsData[0] || [];
            console.log('Exemplo de classificação do Grupo A na API-Football (primeiros 4 times):');
            firstGroup.slice(0, 4).forEach((item: any) => {
                console.log(`- Rank ${item.rank}: ${item.team.name} (Pts: ${item.points}, J: ${item.all.played}, V: ${item.all.win}, GP: ${item.all.goals.for}, GC: ${item.all.goals.against}, SG: ${item.goalsDiff})`);
            });
        }

        // 2. Buscar da API ZapScore (VPS EasyPanel)
        console.log('\n📥 Buscando dados do banco de dados (via API ZapScore)...');
        const dbResponse = await axios.get(ZAPSCORE_API_URL);
        const dbStandings = dbResponse.data;
        
        if (!dbStandings || dbStandings.length === 0) {
            console.log('⚠️ Nenhum dado de classificação encontrado no banco de dados para a Copa 2026.');
        } else {
            console.log(`✅ Banco de dados retornou ${dbStandings.length} registros de classificação.`);
            console.log('Exemplo de classificação no banco de dados (primeiros 4 registros):');
            dbStandings.slice(0, 4).forEach((item: any) => {
                console.log(`- Rank ${item.rank}: ${item.team.name} (Pts: ${item.points}, J: ${item.played}, V: ${item.win}, GP: ${item.goalsFor}, GC: ${item.goalsAgainst}, SG: ${item.goalsDiff})`);
            });
        }

        // 3. Comparação direta
        if (apiStandingsData && dbStandings && dbStandings.length > 0) {
            console.log('\n🔍 Comparando os dois dados:');
            const flatApiStandings = apiStandingsData.flat();
            console.log(`Total de times na API: ${flatApiStandings.length}`);
            console.log(`Total de times no Banco: ${dbStandings.length}`);

            const sampleTeamName = flatApiStandings[0]?.team?.name;
            if (sampleTeamName) {
                const apiSample = flatApiStandings.find((t: any) => t.team.name === sampleTeamName);
                const dbSample = dbStandings.find((t: any) => t.team.name === sampleTeamName);
                console.log(`\nComparação para o time "${sampleTeamName}":`);
                console.log(`- Na API: Rank ${apiSample?.rank}, Pts ${apiSample?.points}, GP ${apiSample?.all?.goals?.for}, GC ${apiSample?.all?.goals?.against}`);
                console.log(`- No Banco: Rank ${dbSample?.rank}, Pts ${dbSample?.points}, GP ${dbSample?.goalsFor}, GC ${dbSample?.goalsAgainst}`);
            }
        }
        
    } catch (error) {
        console.error('❌ Erro na comparação:', error.message);
        if (error.response) {
            console.error('Detalhes do erro:', error.response.data);
        }
    }
}

main();
