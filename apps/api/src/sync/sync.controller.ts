import { Controller, Post, Body, Logger, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { SyncService } from './sync.service';
import { Cearense2027SeederService } from './cearense-2027-seeder.service';
import { Baiano2027SeederService } from './baiano-2027-seeder.service';
import { Sulmatogrossense2027SeederService } from './sulmatogrossense-2027-seeder.service';
import { Tocantinense2027SeederService } from './tocantinense-2027-seeder.service';
import { Amapaense2027SeederService } from './amapaense-2027-seeder.service';
import { Amazonense2027SeederService } from './amazonense-2027-seeder.service';
import { Brasiliense2027SeederService } from './brasiliense-2027-seeder.service';
import { Mineiro2027SeederService } from './mineiro-2027-seeder.service';
import { Capixaba2027SeederService } from './capixaba-2027-seeder.service';
import { Rondoniense2027SeederService } from './rondoniense-2027-seeder.service';
import { Piauiense2027SeederService } from './piauiense-2027-seeder.service';
import { Goiano2027SeederService } from './goiano-2027-seeder.service';
import { Paranaense2027SeederService } from './paranaense-2027-seeder.service';
import { Paraense2027SeederService } from './paraense-2027-seeder.service';
import { Matogrossense2027SeederService } from './matogrossense-2027-seeder.service';
import { Acreano2027SeederService } from './acreano-2027-seeder.service';
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
    private readonly cearenseSeeder: Cearense2027SeederService,
    private readonly baianoSeeder: Baiano2027SeederService,
    private readonly sulmatogrossenseSeeder: Sulmatogrossense2027SeederService,
    private readonly tocantinenseSeeder: Tocantinense2027SeederService,
    private readonly amapaenseSeeder: Amapaense2027SeederService,
    private readonly amazonenseSeeder: Amazonense2027SeederService,
    private readonly brasilienseSeeder: Brasiliense2027SeederService,
    private readonly mineiroSeeder: Mineiro2027SeederService,
    private readonly capixabaSeeder: Capixaba2027SeederService,
    private readonly rondonienseSeeder: Rondoniense2027SeederService,
    private readonly piauienseSeeder: Piauiense2027SeederService,
    private readonly goianoSeeder: Goiano2027SeederService,
    private readonly paranaenseSeeder: Paranaense2027SeederService,
    private readonly paraenseSeeder: Paraense2027SeederService,
    private readonly matogrossenseSeeder: Matogrossense2027SeederService,
    private readonly acreanoSeeder: Acreano2027SeederService,
  ) {}

  @Post('seed-cearense-2027')
  async seedCearense2027() {
    return this.cearenseSeeder.seedCearense2027();
  }

  @Post('seed-baiano-2027')
  async seedBaiano2027() {
    return this.baianoSeeder.seedBaiano2027();
  }

  @Post('seed-sulmatogrossense-2027')
  async seedSulmatogrossense2027() {
    return this.sulmatogrossenseSeeder.seedSulmatogrossense2027();
  }

  @Post('seed-tocantinense-2027')
  async seedTocantinense2027() {
    return this.tocantinenseSeeder.seedTocantinense2027();
  }

  @Post('seed-amapaense-2027')
  async seedAmapaense2027() {
    return this.amapaenseSeeder.seedAmapaense2027();
  }

  @Post('seed-amazonense-2027')
  async seedAmazonense2027() {
    return this.amazonenseSeeder.seedAmazonense2027();
  }

  @Post('seed-brasiliense-2027')
  async seedBrasiliense2027() {
    return this.brasilienseSeeder.seedBrasiliense2027();
  }

  @Post('seed-mineiro-2027')
  async seedMineiro2027() {
    return this.mineiroSeeder.seedMineiro2027();
  }

  @Post('seed-capixaba-2027')
  async seedCapixaba2027() {
    return this.capixabaSeeder.seedCapixaba2027();
  }

  @Post('seed-rondoniense-2027')
  async seedRondoniense2027() {
    return this.rondonienseSeeder.seedRondoniense2027();
  }

  @Post('seed-piauiense-2027')
  async seedPiauiense2027() {
    return this.piauienseSeeder.seedPiauiense2027();
  }

  @Post('seed-goiano-2027')
  async seedGoiano2027() {
    return this.goianoSeeder.seedGoiano2027();
  }

  @Post('seed-paranaense-2027')
  async seedParanaense2027() {
    return this.paranaenseSeeder.seedParanaense2027();
  }

  @Post('seed-paraense-2027')
  async seedParaense2027() {
    return this.paraenseSeeder.seedParaense2027();
  }

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

  @Post('seed-matogrossense-2027')
  async seedMatogrossense2027() {
    return this.matogrossenseSeeder.seedMatogrossense2027();
  }

  @Post('seed-acreano-2027')
  async seedAcreano2027() {
    return this.acreanoSeeder.seedAcreano2027();
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

