import axios from 'axios';
import 'dotenv/config';

const BASE_URL = process.env.ZAPSCORE_API_URL!;
const API_KEY  = process.env.ZAPSCORE_API_KEY!;

const client = axios.create({
  baseURL: BASE_URL,
  headers: { 'x-api-key': API_KEY },
  timeout: 15000,
});

export const ZapScoreClient = {
  /** Partidas de hoje — opcionalmente filtrado por leagueId (externalId) */
  async getTodayFixtures(leagueId?: number): Promise<any[]> {
    const params: any = {};
    if (leagueId) params.leagueId = leagueId;
    const res = await client.get('/fixtures/today', { params });
    return res.data || [];
  },

  /** Liga pelo externalId */
  async getLeagues(leagueId: number): Promise<any[]> {
    const res = await client.get('/leagues', { params: { externalId: leagueId } });
    const raw = res.data;
    // ZapScore API retorna { data: [...], Count: N } ou array direto
    if (Array.isArray(raw)) return raw;
    if (raw?.data && Array.isArray(raw.data)) return raw.data;
    return [];
  },

  /** Times de uma liga/temporada */
  async getTeamsByLeague(leagueId: number, season: number): Promise<any[]> {
    const res = await client.get('/teams', { params: { leagueId, season } });
    const raw = res.data;
    if (Array.isArray(raw)) return raw;
    if (raw?.data && Array.isArray(raw.data)) return raw.data;
    return [];
  },

  /** Detalhe completo de uma partida (inclui league, homeTeam, awayTeam) */
  async getFixture(id: string): Promise<any> {
    const res = await client.get(`/fixtures/${id}`);
    return res.data;
  },

  /** Eventos de uma partida (gols, cartões, substituições) */
  async getFixtureEvents(id: string): Promise<any[]> {
    const res = await client.get(`/fixtures/${id}/events`);
    return res.data || [];
  },

  /** Estatísticas de uma partida */
  async getFixtureStats(id: string): Promise<any[]> {
    const res = await client.get(`/fixtures/${id}/stats`);
    return res.data || [];
  },

  /** Escalações de uma partida */
  async getFixtureLineups(id: string): Promise<any[]> {
    const res = await client.get(`/fixtures/${id}/lineups`);
    return res.data || [];
  },

  /** Classificação do Brasileirão */
  async getStandings(leagueId: number, season: number): Promise<any[]> {
    const res = await client.get('/standings', { params: { leagueId, season } });
    const raw = res.data;
    if (Array.isArray(raw)) return raw;
    if (raw?.data && Array.isArray(raw.data)) return raw.data;
    return [];
  },
};
