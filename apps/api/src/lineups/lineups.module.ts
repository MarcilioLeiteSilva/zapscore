import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { FixturesModule } from '../fixtures/fixtures.module';
import { LineupsService } from './lineups.service';
import { LineupsController } from './lineups.controller';
import { SofascoreProvider } from './providers/sofascore.provider';
import { FotmobProvider } from './providers/fotmob.provider';
import { GloboesporteProvider } from './providers/globoesporte.provider';
import { PocketbaseProvider } from './providers/pocketbase.provider';
import { EspnProvider } from './providers/espn.provider';

@Module({
  imports: [PrismaModule, FixturesModule],
  controllers: [LineupsController],
  providers: [LineupsService, EspnProvider, SofascoreProvider, FotmobProvider, GloboesporteProvider, PocketbaseProvider],
  exports: [LineupsService],
})
export class LineupsModule {}
