import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { HealthModule } from './health/health.module';
import { VersionModule } from './version/version.module';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { ApiFootballModule } from './integrations/api-football/api-football.module';
import { LeaguesModule } from './leagues/leagues.module';
import { TeamsModule } from './teams/teams.module';
import { FixturesModule } from './fixtures/fixtures.module';
import { StandingsModule } from './standings/standings.module';
import { SyncModule } from './sync/sync.module';
import { CompetitionsModule } from './competitions/competitions.module';
import { NewsModule } from './news/news.module';
import { VideosModule } from './videos/videos.module';
import { PlayersModule } from './players/players.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([{
      ttl: 60000, // 1 minuto em milissegundos (v6+)
      limit: 100, // limite de 100 requisições por IP por minuto
    }]),
    PrismaModule,
    RedisModule,
    ApiFootballModule,
    HealthModule,
    VersionModule,
    LeaguesModule,
    TeamsModule,
    FixturesModule,
    StandingsModule,
    SyncModule,
    CompetitionsModule,
    NewsModule,
    VideosModule,
    PlayersModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
