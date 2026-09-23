import { Controller, Get, Post, Put, Delete, Param, Body, Query, Logger } from '@nestjs/common';
import { ContentScoutService } from './content-scout.service';

@Controller('content-scout')
export class ContentScoutController {
  private readonly logger = new Logger(ContentScoutController.name);

  constructor(private readonly scoutService: ContentScoutService) {}

  @Get('audit')
  async audit() {
    return this.scoutService.audit();
  }

  @Post('heal')
  async heal() {
    return this.scoutService.heal();
  }

  @Get('leagues')
  async getLeagues() {
    return this.scoutService.getLeagues();
  }

  @Put('reassign/:id')
  async reassign(
    @Param('id') id: string,
    @Body() body: { targetLeagueId: string | null }
  ) {
    return this.scoutService.reassignLeague(id, body.targetLeagueId);
  }

  @Delete('news/:id')
  async removeNews(@Param('id') id: string) {
    return this.scoutService.removeNews(id);
  }
}
