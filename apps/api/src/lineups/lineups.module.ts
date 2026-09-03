import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { FixturesModule } from '../fixtures/fixtures.module';
import { LineupsService } from './lineups.service';
import { LineupsController } from './lineups.controller';
import { SofascoreProvider } from './providers/sofascore.provider';
import { FotmobProvider } from './providers/fotmob.provider';
import { GloboesporteProvider } from './providers/globoesporte.provider';

@Module({
  imports: [PrismaModule, FixturesModule],
  controllers: [LineupsController],
  providers: [LineupsService, SofascoreProvider, FotmobProvider, GloboesporteProvider],
  exports: [LineupsService],
})
export class LineupsModule {}
