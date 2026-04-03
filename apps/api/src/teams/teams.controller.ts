import { Controller, Get, Param, Query } from '@nestjs/common';
import { TeamsService } from './teams.service';

@Controller('teams')
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Get()
  async findAll(@Query() query: {
    leagueId?: string;
    season?: string;
    search?: string;
  }) {
    return this.teamsService.findMany({
      leagueId: query.leagueId ? parseInt(query.leagueId) : undefined,
      season: query.season ? parseInt(query.season) : undefined,
      search: query.search,
    });
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.teamsService.findOne(id);
  }
}
