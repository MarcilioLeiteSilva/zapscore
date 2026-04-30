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

  @Get('health')
  health() {
    return { status: 'ok', version: '2026-04-30-v2', commit: '708e615' };
  }

  @Get('statistics')
  async getStats(@Query() query: {
    teamId: string;
    leagueId: string;
    season?: string;
  }) {
    return this.teamsService.getTeamStats(
      parseInt(query.teamId),
      parseInt(query.leagueId),
      query.season ? parseInt(query.season) : 2026,
    );
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.teamsService.findOne(id);
  }
}
