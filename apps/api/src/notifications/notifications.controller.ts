import { Body, Controller, Get, Post, Query } from '@nestjs/common';
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
}
