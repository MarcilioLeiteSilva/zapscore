import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Controller()
export class AppController {
  constructor(private readonly configService: ConfigService) {}

  @Get()
  getInfo() {
    return {
      platform: 'ZapScore — Brazilian Football Data Platform',
      version: '2.0.0',
      status: 'operational',
      environment: this.configService.get<string>('NODE_ENV') || 'production',
      vision: {
        description: 'Scalable data platform for all Brazilian football competitions.',
        monitor: ['Brasileirão Série A (ID 71)', 'Brasileirão Série B (ID 72)', 'Copa do Brasil (ID 73)'],
        active_season: 2026,
      },
      endpoints: {
        health: 'GET /',
        competitions: 'GET /competitions',
        fixtures: {
          list: 'GET /fixtures?leagueId=X&season=Y',
          today: 'GET /fixtures/today',
          detail: 'GET /fixtures/:id',
        },
        standings: 'GET /standings?leagueId=X&season=Y',
        teams: {
          list: 'GET /teams?leagueId=X&search=query',
          detail: 'GET /teams/:id'
        },
        sync: {
            bootstrap: 'POST /sync/bootstrap { leagueId, season }',
            fixtures: 'POST /sync/fixtures { leagueId, season }'
        }
      },
      message: 'Bem-vindo à ZapScore. Acompanhe o melhor do futebol brasileiro.'
    };
  }
}
