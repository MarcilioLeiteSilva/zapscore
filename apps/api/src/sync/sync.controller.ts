import { Controller, Post, Body, Logger, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { SyncService } from './sync.service';
import { NewsCrawlerService } from '../news/news-crawler.service';
import { VideoCrawlerService } from '../videos/video-crawler.service';
import { ApiKeyGuard } from '../common/guards/api-key.guard';

@Controller('sync')
@UseGuards(ApiKeyGuard)
export class SyncController {
  private readonly logger = new Logger(SyncController.name);

  constructor(
    private readonly syncService: SyncService,
    private readonly newsCrawler: NewsCrawlerService,
    private readonly videoCrawler: VideoCrawlerService,
  ) {}

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

  @Post('fixture/:id')
  async syncFixture(@Param('id', ParseIntPipe) id: number) {
    try {
      return await this.syncService.syncByExternalId(id);
    } catch (err: any) {
      this.logger.error(`Error in syncFixture ${id}: ${err.message}`, err.stack);
      return { success: false, error: err.message, stack: err.stack };
    }
  }

  @Post('standings')
  async syncStandings(@Body() body: { leagueId?: number; season?: number }) {
    return this.syncService.syncStandings(body.leagueId, body.season);
  }

  @Post('live')
  async syncLive(@Body() body: { leagueId?: number }) {
    this.logger.log(`Live sync triggered for ${JSON.stringify(body)}`);
    try {
      return await this.syncService.syncLive(body.leagueId);
    } catch (err: any) {
      this.logger.error(`Error in syncLive: ${err.message}`, err.stack);
      return { success: false, error: err.message, stack: err.stack };
    }
  }

  @Post('scorers')
  async syncScorers(@Body() body: { leagueId?: number; season?: number }) {
    this.logger.log(`Scorers sync triggered: ${JSON.stringify(body)}`);
    return this.syncService.syncScorers(body.leagueId, body.season);
  }

  @Post('today')
  async syncToday() {
    this.logger.log('Today sync triggered');
    try {
      return await this.syncService.syncToday();
    } catch (err: any) {
      this.logger.error(`Error in syncToday: ${err.message}`, err.stack);
      return { success: false, error: err.message, stack: err.stack };
    }
  }

  @Post('repair-photos')
  async repairPhotos() {
    this.logger.log('Repair photos triggered');
    return this.syncService.repairPhotos();
  }

  @Post('news')
  async syncNews() {
    this.logger.log('Manual news sync triggered');
    this.newsCrawler.syncAllNews(); // Sem await para rodar em background
    return { success: true, message: 'News sync started in background' };
  }

  @Post('videos')
  async syncVideos() {
    this.logger.log('Manual video sync triggered');
    this.videoCrawler.syncAllVideos(); // Sem await para rodar em background
    return { success: true, message: 'Video sync started in background' };
  }

  @Post('repair-news')
  async repairNews() {
    this.logger.log('Manual news repair triggered');
    const result = await this.newsCrawler.repairNewsData();
    return { success: true, ...result };
  }

  @Post('test-connection')
  async testConnection() {
    this.logger.log('Test connection triggered');
    return this.syncService.testApiFootballConnection();
  }
}

