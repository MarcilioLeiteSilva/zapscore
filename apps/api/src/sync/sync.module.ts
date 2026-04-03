import { Module } from '@nestjs/common';
import { SyncService } from './sync.service';
import { SyncController } from './sync.controller';
import { ApiFootballModule } from '../integrations/api-football/api-football.module';

@Module({
  imports: [ApiFootballModule],
  controllers: [SyncController],
  providers: [SyncService],
  exports: [SyncService],
})
export class SyncModule {}
