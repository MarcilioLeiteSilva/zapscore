import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SyncService } from './sync.service';
import { CompetitionsService } from '../competitions/competitions.service';
import { NewsCrawlerService } from '../news/news-crawler.service';
import { VideoCrawlerService } from '../videos/video-crawler.service';

@Injectable()
export class SyncJobsService {
  private readonly logger = new Logger(SyncJobsService.name);

  constructor(
    private readonly syncService: SyncService,
    private readonly competitionsService: CompetitionsService,
    private readonly newsCrawler: NewsCrawlerService,
    private readonly videoCrawler: VideoCrawlerService,
  ) {}

  // A cada 5 minutos: Sincroniza jogos ao vivo
  @Cron('*/5 * * * *')
  async handleLiveUpdate() {
    this.logger.log('Starting scheduled live matches sync...');
    try {
      await this.syncService.syncLive();
      this.logger.log('Live sync completed successfully.');
    } catch (err) {
      this.logger.error(`Live sync job failed: ${err.message}`);
    }
  }

  // A cada 30 minutos: Sincroniza todos os jogos do dia (Limpeza/Finalização)
  @Cron('*/30 * * * *')
  async handleTodayUpdate() {
    this.logger.log('Starting scheduled cleanup sync (All Today matches)...');
    try {
      await this.syncService.syncToday();
      this.logger.log('Daily matches cleanup completed successfully.');
    } catch (err) {
      this.logger.error(`Today sync job failed: ${err.message}`);
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
  
  // A cada 12 horas: Sincroniza notícias
  @Cron('0 */12 * * *')
  async handleNewsSync() {
    this.logger.log('Starting scheduled news sync...');
    try {
      await this.newsCrawler.syncAllNews();
      this.logger.log('News sync completed successfully.');
    } catch (err) {
      this.logger.error(`News sync job failed: ${err.message}`);
    }
  }

  // Uma vez por dia: Sincroniza vídeos/melhores momentos
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleVideoSync() {
    this.logger.log('Starting scheduled video sync...');
    try {
      await this.videoCrawler.syncAllVideos();
      this.logger.log('Video sync completed successfully.');
    } catch (err) {
      this.logger.error(`Video sync job failed: ${err.message}`);
    }
  }
}
