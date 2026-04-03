import { Module } from '@nestjs/common';
import { SyncService } from './sync.service';
import { SyncController } from './sync.controller';
import { ApiFootballModule } from '../integrations/api-football/api-football.module';
import { PrismaModule } from '../prisma/prisma.module';

import { SyncJobsService } from './sync-jobs.service';
import { CompetitionsModule } from '../competitions/competitions.module';

@Module({
  imports: [PrismaModule, ApiFootballModule, CompetitionsModule],
  controllers: [SyncController],
  providers: [SyncService, SyncJobsService],
  exports: [SyncService],
})
export class SyncModule {}
