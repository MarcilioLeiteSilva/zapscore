import { Controller, Get, Post, Query, Logger, Body } from '@nestjs/common';
import { StateLeagueScoutService } from './state-scout.service';
import { PlayerPhotoAgentService, PhotoSyncFrequency } from './services/player-photo-agent.service';
import { OgolLineupScoutService } from './services/ogol-lineup-scout.service';

@Controller('state-scout')
export class StateScoutController {
  private readonly logger = new Logger(StateScoutController.name);

  constructor(
    private readonly scoutService: StateLeagueScoutService,
    private readonly playerPhotoAgent: PlayerPhotoAgentService,
    private readonly ogolLineupScout: OgolLineupScoutService,
  ) {}

  @Get('status')
  async getStatus() {
    return this.scoutService.getTelemetry();
  }

  @Get('player-photos/config')
  async getPlayerPhotosConfig() {
    return this.playerPhotoAgent.getConfig();
  }

  @Post('player-photos/config')
  async setPlayerPhotosConfig(@Body() body: { frequency: PhotoSyncFrequency }) {
    return this.playerPhotoAgent.setFrequency(body.frequency);
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

  @Post('sync/player-photos')
  async syncPlayerPhotos() {
    return this.playerPhotoAgent.syncMissingPlayerPhotos();
  }

  @Post('sync/ogol-lineups')
  async syncOgolLineups(@Query('leagueId') leagueId?: string) {
    const extId = leagueId ? parseInt(leagueId, 10) : 622;
    return this.ogolLineupScout.syncUpcomingLineups(extId);
  }
}
