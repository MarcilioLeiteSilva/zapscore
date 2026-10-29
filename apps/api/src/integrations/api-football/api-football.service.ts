import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class ApiFootballService {
  private readonly logger = new Logger(ApiFootballService.name);
  private readonly baseUrl: string;
  public readonly apiKey: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.baseUrl = this.configService.get<string>('API_FOOTBALL_BASE_URL', 'https://v3.football.api-sports.io');
    let key = this.configService.get<string>('API_FOOTBALL_KEY', '');
    if (key) {
      key = key.trim().replace(/_REAL$/i, '').replace(/REAL$/i, '');
    }
    this.apiKey = key;
  }


  private get headers() {
    return {
      'x-apisports-key': this.apiKey,
    };
  }

  async getLeagues(params?: any) {
    return this.get('/leagues', params);
  }

  async getTeams(params: { league?: number; season?: number; id?: number }) {
    return this.get('/teams', params);
  }

  async getFixtures(params: { date?: string; league?: number | string; season?: number; id?: number; ids?: string; live?: string; timezone?: string }) {
    return this.get('/fixtures', params);
  }

  async getStandings(params: { league: number; season: number }) {
    return this.get('/standings', params);
  }

  async getTopScorers(params: { league: number; season: number }) {
    return this.get('/players/topscorers', params);
  }

  async getPlayer(params: { id: number; season: number }) {
    return this.get('/players', params);
  }

  async getSquads(teamId: number) {
    return this.get('/players/squads', { team: teamId });
  }

  async getHeadToHead(homeTeamId: number, awayTeamId: number) {
    return this.get('/fixtures/headtohead', {
      h2h: `${homeTeamId}-${awayTeamId}`,
    });
  }

  async getOdds(fixtureExternalId: number) {
    return this.get('/odds', {
      fixture: fixtureExternalId,
    });
  }

  async getInjuries(fixtureExternalId: number) {
    return this.get('/injuries', {
      fixture: fixtureExternalId,
    });
  }

  private readonly cache = new Map<string, { timestamp: number; data: any }>();

  private getTtlForEndpoint(endpoint: string, params: any): number {
    if (endpoint.includes('live') || params?.live) {
      return 60 * 1000; // 60s para live
    }
    if (params?.date) {
      return 10 * 60 * 1000; // 10 min para partidas de hoje
    }
    if (endpoint.includes('headtohead') || endpoint.includes('squads') || endpoint.includes('teams') || endpoint.includes('leagues')) {
      return 24 * 60 * 60 * 1000; // 24h para dados estáticos/H2H
    }
    if (endpoint.includes('standings') || endpoint.includes('topscorers')) {
      return 2 * 60 * 60 * 1000; // 2h para tabelas/artilharia
    }
    return 5 * 60 * 1000; // 5 min padrão
  }

  async get(endpoint: string, params: any) {
    if (!this.apiKey) {
      this.logger.error('API_FOOTBALL_KEY is not defined');
      throw new Error('API_FOOTBALL_KEY is not defined');
    }

    const cacheKey = `${endpoint}_${JSON.stringify(params || {})}`;
    const now = Date.now();
    const cached = this.cache.get(cacheKey);

    if (cached && (now - cached.timestamp) < this.getTtlForEndpoint(endpoint, params)) {
      this.logger.debug(`[Cache Hit] Returning cached response for ${endpoint}`);
      return cached.data;
    }

    try {
      this.logger.log(`Requesting ${endpoint} with params: ${JSON.stringify(params)}`);
      const response = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}${endpoint}`, {
          headers: this.headers,
          params,
        }),
      );

      if (response.data.errors && Object.keys(response.data.errors).length > 0) {
        this.logger.error(`API-Football Error: ${JSON.stringify(response.data.errors)}`);
        throw new Error(`API-Football Error: ${JSON.stringify(response.data.errors)}`);
      }

      const result = response.data.response;
      this.cache.set(cacheKey, { timestamp: now, data: result });

      // Limpeza preventiva de entradas muito antigas para não acumular memória
      if (this.cache.size > 1000) {
        const threshold = now - 24 * 60 * 60 * 1000;
        for (const [k, v] of this.cache.entries()) {
          if (v.timestamp < threshold) this.cache.delete(k);
        }
      }

      return result;
    } catch (error) {
      this.logger.error(`Failed to fetch from API-Football: ${error.message}`);
      throw error;
    }
  }
}

