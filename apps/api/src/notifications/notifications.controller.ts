import { Body, Controller, Get, Param, Post, Put, Query } from '@nestjs/common';
import { NotificationsService, BroadcastPushDto } from './notifications.service';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post('broadcast')
  async sendBroadcast(@Body() body: BroadcastPushDto) {
    return this.notificationsService.sendBroadcast(body);
  }

  @Get('round-summary')
  async getRoundSummary(
    @Query('leagueId') leagueId: number,
    @Query('season') season?: number,
  ) {
    return this.notificationsService.getRoundSummary(Number(leagueId), season ? Number(season) : 2026);
  }

  @Get('lineups-alert')
  async getLineupAlerts(@Query('leagueId') leagueId?: number) {
    return this.notificationsService.getLineupAlerts(leagueId ? Number(leagueId) : undefined);
  }

  @Get('queue')
  async getQueue(@Query('status') status?: string) {
    return this.notificationsService.getQueue(status);
  }

  @Post('queue/enqueue-round')
  async enqueueRoundSummary(
    @Body('leagueId') leagueId: number,
    @Body('season') season?: number,
  ) {
    return this.notificationsService.enqueueRoundSummary(Number(leagueId), season ? Number(season) : 2026);
  }

  @Post('queue/:id/dispatch')
  async dispatchQueueItem(
    @Param('id') id: string,
    @Body() overrideDto?: { title?: string; body?: string; imageUrl?: string },
  ) {
    return this.notificationsService.dispatchQueueItem(id, overrideDto);
  }

  @Post('queue/:id/cancel')
  async cancelQueueItem(@Param('id') id: string) {
    return this.notificationsService.cancelQueueItem(id);
  }

  @Put('queue/:id')
  async updateQueueItem(
    @Param('id') id: string,
    @Body() dto: { title?: string; body?: string; imageUrl?: string },
  ) {
    return this.notificationsService.updateQueueItem(id, dto);
  }
}

