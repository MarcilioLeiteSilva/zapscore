import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { FixturesModule } from '../fixtures/fixtures.module';
import { ApiFootballModule } from '../integrations/api-football/api-football.module';
import { CompetitionsModule } from '../competitions/competitions.module';
import { StateScoutController } from './state-scout.controller';
import { StateLeagueScoutService } from './state-scout.service';
import { FpfDriver } from './drivers/fpf.driver';
import { SumulaParserService } from './services/sumula-parser.service';
import { ContingencyScoreService } from './services/contingency-score.service';

@Module({
  imports: [PrismaModule, FixturesModule, ApiFootballModule, CompetitionsModule],
  controllers: [StateScoutController],
  providers: [StateLeagueScoutService, FpfDriver, SumulaParserService, ContingencyScoreService],
  exports: [StateLeagueScoutService],
})
export class StateScoutModule {}
