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
import { GenerateCommentDto, TacticalAgentResponse } from './interfaces/tactical-comments.types';

@Controller('fixtures')
export class TacticalCommentsController {
  constructor(private readonly tacticalCommentsService: TacticalCommentsService) {}

  /**
   * Retorna a timeline cronológica de comentários táticos da partida
   * Endpoint público (cacheado em memória para suportar alto tráfego de visualizações)
   */
  @Get(':id/comments')
  async getFixtureComments(@Param('id', ParseIntPipe) fixtureId: number) {
    return this.tacticalCommentsService.getComments(fixtureId);
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
