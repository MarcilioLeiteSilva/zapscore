import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';
import { TacticalCommentsController } from './tactical-comments.controller';
import { TacticalCommentsService } from './tactical-comments.service';
import { PocketbaseCommentsClient } from './providers/pocketbase-comments.client';
import { Crawl4aiClient } from './providers/crawl4ai.client';

import { TacticalCommentsSchedulerService } from './tactical-comments-scheduler.service';

@Module({
  imports: [PrismaModule, ConfigModule],
  controllers: [TacticalCommentsController],
  providers: [
    TacticalCommentsService,
    TacticalCommentsSchedulerService,
    PocketbaseCommentsClient,
    Crawl4aiClient,
  ],
  exports: [TacticalCommentsService],
})
export class TacticalCommentsModule {}
