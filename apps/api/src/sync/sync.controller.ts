import { Controller, Post, Body, Logger } from '@nestjs/common';
import { SyncService } from './sync.service';

@Controller('sync')
export class SyncController {
  private readonly logger = new Logger(SyncController.name);

  constructor(private readonly syncService: SyncService) {}

  @Post('bootstrap')
  async syncBootstrap(@Body() body: { leagueId?: number; season?: number }) {
    this.logger.log(`Starting full bootstrap sync: ${JSON.stringify(body)}`);
    return this.syncService.bootstrap(body.leagueId, body.season);
  }

  @Post('leagues')
  async syncLeagues(@Body() body: { leagueId?: number; season?: number }) {
    return this.syncService.syncLeague(body.leagueId, body.season);
  }

  @Post('teams')
  async syncTeams(@Body() body: { leagueId?: number; season?: number }) {
    return this.syncService.syncTeams(body.leagueId, body.season);
  }

  @Post('fixtures')
  async syncFixtures(@Body() body: { leagueId?: number; season?: number }) {
    return this.syncService.syncFixtures(body.leagueId, body.season);
  }

  @Post('standings')
  async syncStandings(@Body() body: { leagueId?: number; season?: number }) {
    return this.syncService.syncStandings(body.leagueId, body.season);
  }

  @Post('live')
  async syncLive(@Body() body: { leagueId?: number }) {
    this.logger.log(`Live sync triggered for ${JSON.stringify(body)}`);
    return this.syncService.syncLive(body.leagueId);
  }
}
