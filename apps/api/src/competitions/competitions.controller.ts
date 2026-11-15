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

  private resolveLeagueExternalId(idParam: string): number {
    const num = parseInt(idParam, 10);
    if (!isNaN(num) && num > 0) return num;

    const lower = (idParam || '').toLowerCase();
    if (lower.includes('amapaense')) return 521;
    if (lower.includes('tocantinense')) return 631;
    if (lower.includes('baiano-1') || lower === 'baiano') return 602;
    if (lower.includes('baiano-2')) return 613;
    if (lower.includes('cearense-1') || lower === 'cearense') return 609;
    if (lower.includes('cearense-2')) return 620;
    if (lower.includes('pernambucano')) return 622;
    if (lower.includes('mineiro-1') || lower === 'mineiro') return 629;
    if (lower.includes('mineiro-2')) return 619;
    if (lower.includes('carioca-a2')) return 851;
    if (lower.includes('carioca')) return 624;
    if (lower.includes('paulista-a2')) return 476;
    if (lower.includes('paulista')) return 475;
    if (lower.includes('gaucho-2')) return 478;
    if (lower.includes('gaucho')) return 477;
    if (lower.includes('paranaense-2')) return 614;
    if (lower.includes('paranaense')) return 606;
    if (lower.includes('goiano')) return 628;
    if (lower.includes('catarinense')) return 604;
    if (lower.includes('matogrossense')) return 630;
    if (lower.includes('sul-matogrossense')) return 623;
    if (lower.includes('brasiliense')) return 610;
    if (lower.includes('alagoano')) return 77;
    if (lower.includes('potiguar')) return 616;
    if (lower.includes('piauiense')) return 621;
    if (lower.includes('sergipano')) return 626;
    if (lower.includes('paraense')) return 627;
    if (lower.includes('amazonense')) return 522;
    if (lower.includes('acreano')) return 520;
    if (lower.includes('rondoniense')) return 615;
    if (lower.includes('roraimense')) return 607;
    if (lower.includes('paraibano')) return 603;
    if (lower.includes('maranhense')) return 608;
    if (lower.includes('capixaba')) return 611;
    if (lower.includes('brasileirao-a') || lower === 'brasileirao') return 71;
    if (lower.includes('brasileirao-b')) return 72;
    return 0;
  }

  @Get(':id')
  getOne(@Param('id') rawId: string) {
    const id = this.resolveLeagueExternalId(rawId);
    return this.competitionsService.findOneByExternalId(id);
  }

  @Get(':id/stored')
  getStoredOne(@Param('id') rawId: string) {
    const id = this.resolveLeagueExternalId(rawId);
    return this.competitionsService.getStoredLeagueByExternalId(id);
  }

  @Get(':id/seasons')
  getSeasons(@Param('id') rawId: string) {
    const id = this.resolveLeagueExternalId(rawId);
    const comp = this.competitionsService.findOneByExternalId(id);
    return comp ? comp.activeSeasons : [];
  }

  @Get(':id/scorers')
  async getScorers(
    @Param('id') rawId: string,
    @Query('season') season?: string,
  ) {
    const id = this.resolveLeagueExternalId(rawId);
    const comp = this.competitionsService.findOneByExternalId(id);
    const targetSeason = season ? parseInt(season, 10) : (comp ? comp.activeSeasons[0] : 2026);
    return this.competitionsService.getTopScorers(id, targetSeason);
  }

  @Post(':id/scorers/auto-sync')
  async autoSyncLeagueScorers(
    @Param('id') rawId: string,
    @Query('season') season?: string,
  ) {
    const id = this.resolveLeagueExternalId(rawId);
    const comp = this.competitionsService.findOneByExternalId(id);
    const targetSeason = season ? parseInt(season, 10) : (comp ? comp.activeSeasons[0] : 2026);
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

  @Get(':id/players')
  async getPlayers(
    @Param('id') rawId: string,
    @Query('season') season?: string,
  ) {
    const id = this.resolveLeagueExternalId(rawId);
    const comp = this.competitionsService.findOneByExternalId(id);
    const targetSeason = season ? parseInt(season, 10) : (comp ? comp.activeSeasons[0] : 2026);
    return this.competitionsService.getCompetitionPlayers(id, targetSeason);
  }

  @Put('players/:playerId/photo')
  async updatePlayerPhoto(
    @Param('playerId', ParseIntPipe) playerId: number,
    @Body() body: { photo: string; teamExternalId?: number; playerName?: string },
  ) {
    return this.competitionsService.updatePlayerPhoto(playerId, body);
  }

  @Post('players')
  async createPlayer(@Body() body: any) {
    return this.competitionsService.createPlayer(body);
  }

  @Put('players/:playerId')
  async updatePlayer(
    @Param('playerId', ParseIntPipe) playerId: number,
    @Body() body: any,
  ) {
    return this.competitionsService.updatePlayer(playerId, body);
  }

  @Delete('players/:playerId')
  async deletePlayer(
    @Param('playerId', ParseIntPipe) playerId: number,
    @Query('teamExternalId') teamExternalId?: string,
  ) {
    const extId = teamExternalId ? parseInt(teamExternalId, 10) : undefined;
    return this.competitionsService.deletePlayer(playerId, extId);
  }
}
