import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class ApiFootballService {
  private readonly logger = new Logger(ApiFootballService.name);
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.baseUrl = this.configService.get<string>('API_FOOTBALL_BASE_URL', 'https://v3.football.api-sports.io');
    this.apiKey = this.configService.get<string>('API_FOOTBALL_KEY', '');
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

  async getFixtures(params: { date?: string; league?: number; season?: number; id?: number }) {
    return this.get('/fixtures', params);
  }

  async getStandings(params: { league: number; season: number }) {
    return this.get('/standings', params);
  }

  private async get(endpoint: string, params: any) {
    if (!this.apiKey) {
      this.logger.error('API_FOOTBALL_KEY is not defined');
      throw new Error('API_FOOTBALL_KEY is not defined');
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

      return response.data.response;
    } catch (error) {
      this.logger.error(`Failed to fetch from API-Football: ${error.message}`);
      throw error;
    }
  }
}
