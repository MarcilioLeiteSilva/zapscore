import { Controller, Get, Post, Put, Delete, Body, Param, Query, ParseIntPipe } from '@nestjs/common';
import { CompetitionsService } from './competitions.service';
import { ScorerAgentService } from './scorer-agent.service';

@Controller('competitions')
export class CompetitionsController {
  constructor(
    private readonly competitionsService: CompetitionsService,
    private readonly scorerAgentService: ScorerAgentService,
  ) {}

  @Get()
  getAvailable() {
    return this.competitionsService.findAll();
  }

  @Get('stored')
  getStored() {
    return this.competitionsService.getStoredLeagues();
  }

  @Get(':id')
  getOne(@Param('id', ParseIntPipe) id: number) {
    return this.competitionsService.findOneByExternalId(id);
  }

  @Get(':id/stored')
  getStoredOne(@Param('id', ParseIntPipe) id: number) {
    return this.competitionsService.getStoredLeagueByExternalId(id);
  }

  @Get(':id/seasons')
  getSeasons(@Param('id', ParseIntPipe) id: number) {
    const comp = this.competitionsService.findOneByExternalId(id);
    return comp ? comp.activeSeasons : [];
  }

  @Get(':id/scorers')
  async getScorers(
    @Param('id', ParseIntPipe) id: number,
    @Query('season') season?: string,
  ) {
    const comp = this.competitionsService.findOneByExternalId(id);
    const targetSeason = season ? parseInt(season, 10) : (comp ? comp.activeSeasons[0] : 2026);
    return this.competitionsService.getTopScorers(id, targetSeason);
  }

  @Post(':id/scorers/auto-sync')
  async autoSyncLeagueScorers(
    @Param('id', ParseIntPipe) id: number,
    @Query('season') season?: string,
  ) {
    const targetSeason = season ? parseInt(season, 10) : 2026;
    return this.scorerAgentService.aggregateLeagueScorers(id, targetSeason);
  }

  @Post('scorers/auto-sync-all')
  async autoSyncAllScorers(@Query('season') season?: string) {
    const targetSeason = season ? parseInt(season, 10) : 2026;
    return this.scorerAgentService.aggregateAllActiveLeagues(targetSeason);
  }

  @Post('scorers')
  createScorer(@Body() body: any) {
    return this.competitionsService.createScorer(body);
  }

  @Put('scorers/:id')
  updateScorer(@Param('id') id: string, @Body() body: any) {
    return this.competitionsService.updateScorer(id, body);
  }

  @Delete('scorers/:id')
  deleteScorer(@Param('id') id: string) {
    return this.competitionsService.deleteScorer(id);
  }
}
