import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  ParseIntPipe,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiKeyGuard } from '../common/guards/api-key.guard';
import { TacticalCommentsService } from './tactical-comments.service';
import {
  GenerateCommentDto,
  TacticalAgentResponse,
  TacticalPromptConfig,
} from './interfaces/tactical-comments.types';
import { FixtureBroadcastRecord } from './crawler/crawler.types';

@Controller('fixtures')
export class TacticalCommentsController {
  constructor(private readonly tacticalCommentsService: TacticalCommentsService) {}

  /**
   * Obtém a calibração do prompt de comentários táticos
   */
  @Get('comments/config')
  async getPromptConfig() {
    return this.tacticalCommentsService.getPromptConfig();
  }

  /**
   * Atualiza a calibração do prompt de comentários táticos
   * Protegido por ADMIN_API_KEY (header: x-api-key)
   */
  @Post('comments/config')
  @UseGuards(ApiKeyGuard)
  @HttpCode(HttpStatus.OK)
  async savePromptConfig(@Body() config: Partial<TacticalPromptConfig>) {
    return this.tacticalCommentsService.savePromptConfig(config);
  }

  /**
   * Retorna a timeline cronológica de comentários táticos da partida
   * Endpoint público (cacheado em memória para suportar alto tráfego de visualizações)
   */
  @Get(':id/comments')
  async getFixtureComments(@Param('id', ParseIntPipe) fixtureId: number) {
    return this.tacticalCommentsService.getComments(fixtureId);
  }

  /**
   * Retorna as informações de transmissão ("Onde Assistir") da partida
   * Endpoint público
   */
  @Get(':id/broadcast')
  async getFixtureBroadcast(@Param('id', ParseIntPipe) fixtureId: number) {
    return this.tacticalCommentsService.getBroadcast(fixtureId);
  }

  /**
   * Atualiza ou cadastra manualmente a transmissão ("Onde Assistir") de uma partida
   * Protegido por ADMIN_API_KEY (header: x-api-key)
   */
  @Post(':id/broadcast')
  @UseGuards(ApiKeyGuard)
  @HttpCode(HttpStatus.OK)
  async saveFixtureBroadcast(
    @Param('id', ParseIntPipe) fixtureId: number,
    @Body() body: Partial<FixtureBroadcastRecord>,
  ) {
    return this.tacticalCommentsService.saveBroadcast({
      fixture_id: fixtureId,
      league_id: body.league_id || 0,
      match_title: body.match_title,
      tv_open: body.tv_open,
      tv_closed: body.tv_closed,
      streaming: body.streaming,
      details: body.details,
      source_url: body.source_url,
    });
  }

  /**
   * Retorna prévia em tempo real da coleta de múltiplas fontes esportivas
   */
  @Get(':id/comments/multi-source-preview')
  async previewMultiSourceDelta(@Param('id', ParseIntPipe) fixtureId: number) {
    return this.tacticalCommentsService.previewMultiSourceDelta(fixtureId);
  }

  /**
   * Dispara a geração de um comentário tático para a partida
   * Protegido por ADMIN_API_KEY (header: x-api-key)
   */
  @Post(':id/comments/generate')
  @UseGuards(ApiKeyGuard)
  @HttpCode(HttpStatus.OK)
  async generateFixtureComment(
    @Param('id', ParseIntPipe) fixtureId: number,
    @Body() dto: GenerateCommentDto,
  ): Promise<TacticalAgentResponse> {
    return this.tacticalCommentsService.generateTacticalComment(fixtureId, dto);
  }
}

