import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';
import { TacticalCommentsController } from './tactical-comments.controller';
import { TacticalCommentsService } from './tactical-comments.service';
import { PocketbaseCommentsClient } from './providers/pocketbase-comments.client';
import { Crawl4aiClient } from './providers/crawl4ai.client';
import { TacticalCommentsSchedulerService } from './tactical-comments-scheduler.service';
import { MultiSourceCommentsAgentService } from './crawler/multi-source-comments-agent.service';
import { EspnLiveAdapter } from './crawler/adapters/espn.adapter';
import { GazetaLiveAdapter } from './crawler/adapters/gazeta.adapter';
import { GeGloboLiveAdapter } from './crawler/adapters/ge-globo.adapter';
import { LanceLiveAdapter } from './crawler/adapters/lance.adapter';
import { UolLiveAdapter } from './crawler/adapters/uol.adapter';

@Module({
  imports: [PrismaModule, ConfigModule],
  controllers: [TacticalCommentsController],
  providers: [
    TacticalCommentsService,
    TacticalCommentsSchedulerService,
    PocketbaseCommentsClient,
    Crawl4aiClient,
    MultiSourceCommentsAgentService,
    EspnLiveAdapter,
    GazetaLiveAdapter,
    GeGloboLiveAdapter,
    LanceLiveAdapter,
    UolLiveAdapter,
  ],
  exports: [TacticalCommentsService, MultiSourceCommentsAgentService],
})
export class TacticalCommentsModule {}

