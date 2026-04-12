import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import * as dotenv from 'dotenv';

dotenv.config({ path: 'apps/api/.env' });

const API_KEY = 'ac2466bba57666a7fa0dd153228f71d6';
const BASE_URL = 'https://v3.football.api-sports.io';

const prisma = new PrismaClient();

async function syncLeagueFixtures(leagueId: number, season: number) {
    console.log(`\n🚀 Iniciando reparo para Liga ${leagueId} Temporada ${season}...`);
    
    try {
        const response = await axios.get(`${BASE_URL}/fixtures`, {
            headers: { 'x-apisports-key': API_KEY },
            params: { league: leagueId, season: season }
        });

        const fixtures = response.data.response;
        console.log(`✅ Recebidos ${fixtures.length} jogos da API.`);

        const league = await prisma.league.findUnique({ where: { externalId: leagueId } });
        if (!league) {
            console.error(`❌ Liga ${leagueId} não encontrada no banco. Rode o bootstrap primeiro.`);
            return;
        }

        let updated = 0;
        for (const data of fixtures) {
            const hTeam = await prisma.team.findUnique({ where: { externalId: data.teams.home.id } });
            const aTeam = await prisma.team.findUnique({ where: { externalId: data.teams.away.id } });

            if (!hTeam || !aTeam) continue;

            await prisma.fixture.upsert({
                where: { externalId: data.fixture.id },
                update: {
                    round: data.league.round,
                    statusLong: data.fixture.status.long,
                    statusShort: data.fixture.status.short,
                    homeGoals: data.goals.home,
                    awayGoals: data.goals.away,
                },
                create: {
                    externalId: data.fixture.id,
                    leagueId: league.id,
                    season: season,
                    date: new Date(data.fixture.date),
                    round: data.league.round,
                    statusLong: data.fixture.status.long,
                    statusShort: data.fixture.status.short,
                    homeTeamId: hTeam.id,
                    awayTeamId: aTeam.id,
                    homeGoals: data.goals.home,
                    awayGoals: data.goals.away,
                }
            });
            updated++;
        }
        console.log(`✅ ${updated} jogos atualizados com informações de rodada.`);
    } catch (error) {
        console.error(`❌ Erro ao sincronizar liga ${leagueId}:`, error.message);
    }
}

async function main() {
    if (!API_KEY) {
        console.error('❌ API_FOOTBALL_KEY não encontrada no .env');
        return;
    }

    await syncLeagueFixtures(71, 2026); // Série A
    await syncLeagueFixtures(72, 2026); // Série B
    await syncLeagueFixtures(73, 2026); // Copa do Brasil

    console.log('\n✨ Reparo concluído!');
    await prisma.$disconnect();
}

main();
