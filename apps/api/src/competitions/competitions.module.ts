import { Module } from '@nestjs/common';
import { CompetitionsService } from './competitions.service';
import { CompetitionsController } from './competitions.controller';
import { ScorerAgentService } from './scorer-agent.service';
import { PrismaModule } from '../prisma/prisma.module';
import { ApiFootballModule } from '../integrations/api-football/api-football.module';
import { RedisModule } from '../redis/redis.module';
import { PocketBaseSyncService } from '../integrations/pocketbase/pocketbase-sync.service';

@Module({
  imports: [PrismaModule, ApiFootballModule, RedisModule],
  providers: [CompetitionsService, ScorerAgentService, PocketBaseSyncService],
  controllers: [CompetitionsController],
  exports: [CompetitionsService, ScorerAgentService],
})
export class CompetitionsModule {}

