import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { CompetitionsService } from './competitions.service';

@Controller('competitions')
export class CompetitionsController {
  constructor(private readonly competitionsService: CompetitionsService) {}

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
    @Query('season') season?: number,
  ) {
    // Busca a season ativa se não for passada
    const comp = this.competitionsService.findOneByExternalId(id);
    const targetSeason = season || (comp ? comp.activeSeasons[0] : 2026);
    return this.competitionsService.getTopScorers(id, targetSeason);
  }
}
