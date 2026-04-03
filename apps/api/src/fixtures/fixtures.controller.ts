import { Controller, Get, Param, Query, ParseIntPipe } from '@nestjs/common';
import { FixturesService } from './fixtures.service';

@Controller('fixtures')
export class FixturesController {
  constructor(private readonly fixturesService: FixturesService) {}

  @Get()
  async findAll(@Query() query: {
    leagueId?: string;
    season?: string;
    teamId?: string;
    date?: string;
    round?: string;
    status?: string;
    limit?: string;
    page?: string;
  }) {
    return this.fixturesService.findMany({
      leagueId: query.leagueId ? parseInt(query.leagueId) : undefined,
      season: query.season ? parseInt(query.season) : undefined,
      teamId: query.teamId ? parseInt(query.teamId) : undefined,
      date: query.date,
      round: query.round,
      status: query.status,
      limit: query.limit ? parseInt(query.limit) : 50,
      page: query.page ? parseInt(query.page) : 1,
    });
  }

  @Get('today')
  async findToday(@Query('leagueId') leagueId?: string) {
    return this.fixturesService.findToday(leagueId ? parseInt(leagueId) : undefined);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.fixturesService.findById(id);
  }
}
