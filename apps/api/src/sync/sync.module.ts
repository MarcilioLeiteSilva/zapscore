import { Module } from '@nestjs/common';
import { SyncService } from './sync.service';
import { SyncController } from './sync.controller';
import { ApiFootballModule } from '../integrations/api-football/api-football.module';
import { PrismaModule } from '../prisma/prisma.module';

import { SyncJobsService } from './sync-jobs.service';
import { SyncContentService } from './sync-content.service';
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
import { CompetitionsModule } from '../competitions/competitions.module';
import { NewsModule } from '../news/news.module';
import { VideosModule } from '../videos/videos.module';
import { FixturesModule } from '../fixtures/fixtures.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { LineupsModule } from '../lineups/lineups.module';

@Module({
  imports: [PrismaModule, ApiFootballModule, CompetitionsModule, NewsModule, VideosModule, FixturesModule, NotificationsModule, LineupsModule],
  controllers: [SyncController],
  providers: [SyncService, SyncJobsService, SyncContentService, Cearense2027SeederService, Baiano2027SeederService, Sulmatogrossense2027SeederService, Tocantinense2027SeederService, Amapaense2027SeederService, Amazonense2027SeederService, Brasiliense2027SeederService, Mineiro2027SeederService, Capixaba2027SeederService, Rondoniense2027SeederService, Piauiense2027SeederService, Goiano2027SeederService, Paranaense2027SeederService],
  exports: [SyncService, Cearense2027SeederService, Baiano2027SeederService, Sulmatogrossense2027SeederService, Tocantinense2027SeederService, Amapaense2027SeederService, Amazonense2027SeederService, Brasiliense2027SeederService, Mineiro2027SeederService, Capixaba2027SeederService, Rondoniense2027SeederService, Piauiense2027SeederService, Goiano2027SeederService, Paranaense2027SeederService],
})
export class SyncModule {}


