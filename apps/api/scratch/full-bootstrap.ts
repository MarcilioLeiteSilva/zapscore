import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const API_KEY = 'ac2466bba57666a7fa0dd153228f71d6';
const BASE_URL = 'https://v3.football.api-sports.io';
const SEASON = 2026;

const prisma = new PrismaClient();

const SUPPORTED_LEAGUES = [71, 72, 73, 612, 1, 13];

async function apiGet(endpoint: string, params: any) {
    const response = await axios.get(`${BASE_URL}${endpoint}`, {
        headers: { 'x-apisports-key': API_KEY },
        params
    });
    return response.data.response;
}

async function bootstrapLeague(leagueId: number) {
    console.log(`\n-------------------------------------------`);
    console.log(`🚀 Iniciando Carga para Liga ID: ${leagueId}`);
    console.log(`-------------------------------------------`);

    try {
        // 1. Sincronizar Liga
        const leagueData = await apiGet('/leagues', { id: leagueId });
        if (!leagueData.length) return;
        const l = leagueData[0];
        
        const dbLeague = await prisma.league.upsert({
            where: { externalId: leagueId },
            update: { name: l.league.name, country: l.country.name, type: l.league.type, season: SEASON },
            create: { externalId: leagueId, name: l.league.name, country: l.country.name, type: l.league.type, season: SEASON }
        });
        console.log(`✅ Liga: ${dbLeague.name}`);

        // 2. Sincronizar Times
        console.log(`⏳ Buscando times...`);
        const teamsData = await apiGet('/teams', { league: leagueId, season: SEASON });
        for (const t of teamsData) {
            await prisma.team.upsert({
                where: { externalId: t.team.id },
                update: { name: t.team.name, code: t.team.code, logo: t.team.logo },
                create: { externalId: t.team.id, name: t.team.name, code: t.team.code, logo: t.team.logo }
            });
        }
        console.log(`✅ ${teamsData.length} times sincronizados.`);

        // 3. Sincronizar Jogos (Fixtures)
        console.log(`⏳ Buscando calendário de jogos...`);
        const fixturesData = await apiGet('/fixtures', { league: leagueId, season: SEASON });
        let fixtureCount = 0;
        for (const f of fixturesData) {
            const hTeam = await prisma.team.findUnique({ where: { externalId: f.teams.home.id } });
            const aTeam = await prisma.team.findUnique({ where: { externalId: f.teams.away.id } });

            if (!hTeam || !aTeam) continue;

            await prisma.fixture.upsert({
                where: { externalId: f.fixture.id },
                update: {
                    date: new Date(f.fixture.date),
                    round: f.league.round,
                    statusLong: f.fixture.status.long,
                    statusShort: f.fixture.status.short,
                    homeGoals: f.goals.home,
                    awayGoals: f.goals.away,
                },
                create: {
                    externalId: f.fixture.id,
                    leagueId: dbLeague.id,
                    season: SEASON,
                    date: new Date(f.fixture.date),
                    round: f.league.round,
                    statusLong: f.fixture.status.long,
                    statusShort: f.fixture.status.short,
                    homeTeamId: hTeam.id,
                    awayTeamId: aTeam.id,
                    homeGoals: f.goals.home,
                    awayGoals: f.goals.away,
                }
            });
            fixtureCount++;
        }
        console.log(`✅ ${fixtureCount} jogos sincronizados.`);

        // 4. Sincronizar Tabela (se for league)
        if (l.league.type === 'League') {
            console.log(`⏳ Buscando classificação...`);
            const standingsData = await apiGet('/standings', { league: leagueId, season: SEASON });
            if (standingsData.length) {
                const standings = standingsData[0].league.standings[0];
                for (const s of standings) {
                    const team = await prisma.team.findUnique({ where: { externalId: s.team.id } });
                    if (!team) continue;

                    await prisma.standing.upsert({
                        where: { leagueId_teamId_season: { leagueId: dbLeague.id, teamId: team.id, season: SEASON } },
                        update: { rank: s.rank, points: s.points, played: s.all.played, win: s.all.win, draw: s.all.draw, lose: s.all.lose, goalsDiff: s.goalsDiff },
                        create: { leagueId: dbLeague.id, teamId: team.id, season: SEASON, rank: s.rank, points: s.points, played: s.all.played, win: s.all.win, draw: s.all.draw, lose: s.all.lose, goalsDiff: s.goalsDiff }
                    });
                }
                console.log(`✅ Classificação atualizada.`);
            }
        }

    } catch (error) {
        console.error(`❌ Erro na liga ${leagueId}:`, error.message);
    }
}

async function main() {
    console.log('🏁 Iniciando Carga Global ZapScore...');
    for (const id of SUPPORTED_LEAGUES) {
        await bootstrapLeague(id);
    }
    console.log('\n✨ Carga concluída com sucesso!');
    await prisma.$disconnect();
}

main();
