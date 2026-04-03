import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
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

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
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
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
