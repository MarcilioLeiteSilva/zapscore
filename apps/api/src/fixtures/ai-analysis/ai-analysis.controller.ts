import { Controller, Get, Post, Param, Query, NotFoundException, UseGuards } from '@nestjs/common';
import { AiSyncService } from './ai-sync.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ApiKeyGuard } from '../../common/guards/api-key.guard';
import { FixturesService } from '../fixtures.service';

@Controller('fixtures')
export class AiAnalysisController {
  constructor(
    private readonly aiSyncService: AiSyncService,
    private readonly prisma: PrismaService,
    private readonly fixturesService: FixturesService,
  ) {}

  @Get('ai-analysis/performance')
  async getPerformance(
    @Query('leagueId') leagueId?: string,
    @Query('days') days?: string,
  ) {
    const parsedLeagueId = leagueId ? parseInt(leagueId, 10) : undefined;
    const parsedDays = days ? parseInt(days, 10) : undefined;
    return this.fixturesService.getAiPerformanceStats({
      leagueId: parsedLeagueId,
      days: parsedDays,
    });
  }

  @Get(':id/ai-analysis')
  async getAnalysis(@Param('id') id: string) {
    let analysis = await this.prisma.fixtureAiAnalysis.findUnique({
      where: { fixtureId: id },
    });

    if (!analysis) {
      try {
        // Tenta gerar sob demanda caso ainda não esteja no cache do banco de dados
        analysis = await this.aiSyncService.syncFixtureAnalysis(id);
      } catch (err) {
        throw new NotFoundException('Análise da IA não disponível para esta partida.');
      }
    }

    return analysis;
  }

  @Post(':id/ai-analysis/sync')
  @UseGuards(ApiKeyGuard)
  async syncAnalysis(@Param('id') id: string, @Query('force') force?: string) {
    const forceUpdate = force === 'true';
    return this.aiSyncService.syncFixtureAnalysis(id, forceUpdate);
  }
}
