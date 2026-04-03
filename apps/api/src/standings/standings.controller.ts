import { Controller, Get, Query } from '@nestjs/common';
import { StandingsService } from './standings.service';

@Controller('standings')
export class StandingsController {
  constructor(private readonly standingsService: StandingsService) {}

  @Get()
  async findByLeagueAndSeason(
    @Query('league') league: string,
    @Query('season') season: string,
  ) {
    if (!league || !season) {
      throw new Error('League and Season are required');
    }
    return this.standingsService.findByLeagueExternalIdAndSeason(Number(league), Number(season));
  }
}
