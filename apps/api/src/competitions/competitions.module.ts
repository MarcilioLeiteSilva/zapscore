import { Module } from '@nestjs/common';
import { CompetitionsService } from './competitions.service';
import { CompetitionsController } from './competitions.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { ApiFootballModule } from '../integrations/api-football/api-football.module';
import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [PrismaModule, ApiFootballModule, RedisModule],
  providers: [CompetitionsService],
  controllers: [CompetitionsController],
  exports: [CompetitionsService],
})
export class CompetitionsModule {}
