"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const axios_1 = __importDefault(require("axios"));
const dotenv = __importStar(require("dotenv"));
dotenv.config({ path: 'apps/api/.env' });
const API_KEY = 'ac2466bba57666a7fa0dd153228f71d6';
const BASE_URL = 'https://v3.football.api-sports.io';
const prisma = new client_1.PrismaClient();
async function syncLeagueFixtures(leagueId, season) {
    console.log(`\n🚀 Iniciando reparo para Liga ${leagueId} Temporada ${season}...`);
    try {
        const response = await axios_1.default.get(`${BASE_URL}/fixtures`, {
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
            if (!hTeam || !aTeam)
                continue;
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
    }
    catch (error) {
        console.error(`❌ Erro ao sincronizar liga ${leagueId}:`, error.message);
    }
}
async function main() {
    if (!API_KEY) {
        console.error('❌ API_FOOTBALL_KEY não encontrada no .env');
        return;
    }
    await syncLeagueFixtures(71, 2026);
    await syncLeagueFixtures(72, 2026);
    await syncLeagueFixtures(73, 2026);
    console.log('\n✨ Reparo concluído!');
    await prisma.$disconnect();
}
main();
//# sourceMappingURL=repair-sync.js.map