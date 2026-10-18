import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { FixturesModule } from '../fixtures/fixtures.module';
import { ApiFootballModule } from '../integrations/api-football/api-football.module';
import { StateScoutController } from './state-scout.controller';
import { StateLeagueScoutService } from './state-scout.service';
import { FpfDriver } from './drivers/fpf.driver';

@Module({
  imports: [PrismaModule, FixturesModule, ApiFootballModule],
  controllers: [StateScoutController],
  providers: [StateLeagueScoutService, FpfDriver],
  exports: [StateLeagueScoutService],
})
export class StateScoutModule {}
