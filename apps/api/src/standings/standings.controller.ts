import { Controller, Get, Query } from '@nestjs/common';
import { StandingsService } from './standings.service';

@Controller('standings')
export class StandingsController {
  constructor(private readonly standingsService: StandingsService) {}

  @Get()
  async findAll(@Query() query: {
    leagueId?: string;
    season?: string;
  }) {
    return this.standingsService.findMany({
      leagueId: query.leagueId ? parseInt(query.leagueId) : undefined,
      season: query.season ? parseInt(query.season) : 2026,
    });
  }
}
