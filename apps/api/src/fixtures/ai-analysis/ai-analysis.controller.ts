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
  async getAnalysis(
    @Param('id') id: string,
    @Query('lang') lang?: string,
  ) {
    let resolvedFixtureId = id;
    const numId = parseInt(id, 10);
    if (!isNaN(numId) && !id.includes('-')) {
      const fixture = await this.prisma.fixture.findUnique({
        where: { externalId: numId },
        select: { id: true },
      });
      if (fixture) {
        resolvedFixtureId = fixture.id;
      }
    }

    let analysis = await this.prisma.fixtureAiAnalysis.findUnique({
      where: { fixtureId: resolvedFixtureId },
    });

    if (!analysis) {
      try {
        // Tenta gerar sob demanda caso ainda não esteja no cache do banco de dados
        analysis = await this.aiSyncService.syncFixtureAnalysis(resolvedFixtureId);
      } catch (err) {
        throw new NotFoundException('Análise da IA não disponível para esta partida.');
      }
    }

    if (lang && lang.toLowerCase() !== 'pt' && lang.toLowerCase() !== 'pt-br') {
      return this.aiSyncService.getOrTranslateAnalysis(analysis, lang);
    }

    return analysis;
  }

  @Post(':id/ai-analysis/sync')
  @UseGuards(ApiKeyGuard)
  async syncAnalysis(@Param('id') id: string, @Query('force') force?: string) {
    const forceUpdate = force === 'true';
    let resolvedFixtureId = id;
    const numId = parseInt(id, 10);
    if (!isNaN(numId) && !id.includes('-')) {
      const fixture = await this.prisma.fixture.findUnique({
        where: { externalId: numId },
        select: { id: true },
      });
      if (fixture) {
        resolvedFixtureId = fixture.id;
      }
    }
    return this.aiSyncService.syncFixtureAnalysis(resolvedFixtureId, forceUpdate);
  }
}
