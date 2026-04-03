import { Controller, Post, Logger } from '@nestjs/common';
import { SyncService } from './sync.service';

@Controller('sync')
export class SyncController {
  private readonly logger = new Logger(SyncController.name);

  constructor(private readonly syncService: SyncService) {}

  @Post('bootstrap')
  async syncBootstrap() {
    this.logger.log('Starting full bootstrap sync for default league & season');
    await this.syncService.syncLeague();
    await this.syncService.syncTeams();
    await this.syncService.syncFixtures();
    await this.syncService.syncStandings();
    return { status: 'Bootstrap sync completed' };
  }

  @Post('leagues/71')
  async syncLeagues() {
    return this.syncService.syncLeague();
  }

  @Post('teams')
  async syncTeams() {
    return this.syncService.syncTeams();
  }

  @Post('fixtures')
  async syncFixtures() {
    return this.syncService.syncFixtures();
  }

  @Post('standings')
  async syncStandings() {
    return this.syncService.syncStandings();
  }
}
