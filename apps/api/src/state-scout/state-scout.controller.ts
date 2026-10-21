import { Controller, Get, Post, Query, Logger } from '@nestjs/common';
import { StateLeagueScoutService } from './state-scout.service';

@Controller('state-scout')
export class StateScoutController {
  private readonly logger = new Logger(StateScoutController.name);

  constructor(private readonly scoutService: StateLeagueScoutService) {}

  @Get('status')
  async getStatus() {
    return this.scoutService.getTelemetry();
  }

  @Post('reconcile')
  async reconcile(@Query('leagueId') leagueId?: string) {
    const extId = leagueId ? parseInt(leagueId, 10) : undefined;
    return this.scoutService.reconcileAll(extId);
  }

  @Post('reconcile/schedule')
  async reconcileSchedule(@Query('leagueId') leagueId?: string) {
    const extId = leagueId ? parseInt(leagueId, 10) : undefined;
    return this.scoutService.reconcileSchedule(extId);
  }

  @Post('reconcile/results')
  async reconcileResults(@Query('leagueId') leagueId?: string) {
    const extId = leagueId ? parseInt(leagueId, 10) : undefined;
    return this.scoutService.reconcileMatchResults(extId);
  }

  @Post('reconcile/past-games')
  async reconcilePastGames(@Query('leagueId') leagueId?: string) {
    const extId = leagueId ? parseInt(leagueId, 10) : undefined;
    return this.scoutService.reconcilePastGames(extId);
  }

  @Post('reconcile/live')
  async reconcileLive() {
    return this.scoutService.processMatchdayLive();
  }
}
