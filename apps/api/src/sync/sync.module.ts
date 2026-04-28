import { Module } from '@nestjs/common';
import { SyncService } from './sync.service';
import { SyncController } from './sync.controller';
import { ApiFootballModule } from '../integrations/api-football/api-football.module';
import { PrismaModule } from '../prisma/prisma.module';

import { SyncJobsService } from './sync-jobs.service';
import { SyncContentService } from './sync-content.service';
import { CompetitionsModule } from '../competitions/competitions.module';
import { NewsModule } from '../news/news.module';
import { VideosModule } from '../videos/videos.module';

@Module({
  imports: [PrismaModule, ApiFootballModule, CompetitionsModule, NewsModule, VideosModule],
  controllers: [SyncController],
  providers: [SyncService, SyncJobsService, SyncContentService],
  exports: [SyncService],
})
export class SyncModule {}
