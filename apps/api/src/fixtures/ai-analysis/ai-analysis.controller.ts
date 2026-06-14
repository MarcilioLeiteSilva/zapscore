import { Controller, Get, Post, Param, Query, NotFoundException, UseGuards } from '@nestjs/common';
import { AiSyncService } from './ai-sync.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ApiKeyGuard } from '../../common/guards/api-key.guard';

@Controller('fixtures')
export class AiAnalysisController {
  constructor(
    private readonly aiSyncService: AiSyncService,
    private readonly prisma: PrismaService,
  ) {}

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
