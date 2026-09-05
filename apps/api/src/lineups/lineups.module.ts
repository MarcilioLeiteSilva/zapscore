import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { FixturesModule } from '../fixtures/fixtures.module';
import { TeamsModule } from '../teams/teams.module';
import { LineupsService } from './lineups.service';
import { LineupsController } from './lineups.controller';
import { SofascoreProvider } from './providers/sofascore.provider';
import { FotmobProvider } from './providers/fotmob.provider';
import { GloboesporteProvider } from './providers/globoesporte.provider';
import { PocketbaseProvider } from './providers/pocketbase.provider';
import { EspnProvider } from './providers/espn.provider';
import { UolProvider } from './providers/uol.provider';
import { LivescoreProvider } from './providers/livescore.provider';
import { BesoccerProvider } from './providers/besoccer.provider';

@Module({
  imports: [PrismaModule, FixturesModule, TeamsModule],
  controllers: [LineupsController],
  providers: [
    LineupsService,
    PocketbaseProvider,
    UolProvider,
    EspnProvider,
    GloboesporteProvider,
    LivescoreProvider,
    BesoccerProvider,
    SofascoreProvider,
    FotmobProvider,
  ],
  exports: [LineupsService],
})
export class LineupsModule {}
