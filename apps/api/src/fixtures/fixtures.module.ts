import { Module } from '@nestjs/common';
import { FixturesService } from './fixtures.service';
import { FixturesController } from './fixtures.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { RedisModule } from '../redis/redis.module';
import { AiService } from './ai-analysis/ai.service';
import { AiSyncService } from './ai-analysis/ai-sync.service';
import { AiAnalysisController } from './ai-analysis/ai-analysis.controller';

@Module({
  imports: [PrismaModule, RedisModule],
  controllers: [FixturesController, AiAnalysisController],
  providers: [FixturesService, AiService, AiSyncService],
  exports: [FixturesService, AiSyncService],
})
export class FixturesModule {}

