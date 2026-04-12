import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SyncService } from './sync.service';
import { CompetitionsService } from '../competitions/competitions.service';

@Injectable()
export class SyncJobsService {
  private readonly logger = new Logger(SyncJobsService.name);

  constructor(
    private readonly syncService: SyncService,
    private readonly competitionsService: CompetitionsService,
  ) {}

  // A cada 5 minutos: Sincroniza jogos ao vivo
  @Cron('*/5 * * * *')
  async handleLiveUpdate() {
    this.logger.log('Starting scheduled live matches sync...');
    try {
      await this.syncService.syncLive();
      this.logger.log('Live sync completed successfully for all active competitions.');
    } catch (err) {
      this.logger.error(`Live sync job failed: ${err.message}`);
    }
  }

  // A cada dia à meia-noite: Atualiza classificação completa
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleDailyUpdate() {
    this.logger.log('Starting daily full database sync (Standings)...');
    const activeComps = this.competitionsService.findAll();
    
    for (const comp of activeComps) {
      for (const season of comp.activeSeasons) {
        try {
          await this.syncService.syncStandings(comp.externalId, season);
          this.logger.log(`Daily sync successful for ${comp.name} (${season})`);
        } catch (err) {
          this.logger.error(`Daily sync failed for ${comp.name}: ${err.message}`);
        }
      }
    }
  }
}
