"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const API_KEY = 'ac2466bba57666a7fa0dd153228f71d6';
const BASE_URL = 'https://v3.football.api-sports.io';
async function checkLeague(name) {
    console.log(`🔍 Buscando ID para: ${name}...`);
    try {
        const response = await axios_1.default.get(`${BASE_URL}/leagues`, {
            headers: { 'x-apisports-key': API_KEY },
            params: { search: name }
        });
        const leagues = response.data.response;
        if (leagues && leagues.length > 0) {
            console.log('✅ Ligas encontradas:');
            leagues.forEach((l) => {
                console.log(`- ID: ${l.league.id} | Nome: ${l.league.name} | País: ${l.country.name} | Tipo: ${l.league.type}`);
            });
        }
        else {
            console.log('❌ Nenhuma liga encontrada.');
        }
    }
    catch (error) {
        console.error('❌ Erro na API:', error.response?.data || error.message);
    }
}
async function main() {
    await checkLeague('Copa do Nordeste');
    await checkLeague('World Cup');
}
main();
//# sourceMappingURL=check-leagues.js.map