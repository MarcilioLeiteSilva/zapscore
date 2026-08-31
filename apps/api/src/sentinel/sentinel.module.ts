import { Module } from '@nestjs/common';
import { ZapScoreSentinelService } from './zapscore-sentinel.service';
import { SentinelAlertService } from './sentinel-alert.service';
import { ZapScoreSentinelController } from './zapscore-sentinel.controller';
import { ApiFootballModule } from '../integrations/api-football/api-football.module';
import { PrismaModule } from '../prisma/prisma.module';
import { SyncModule } from '../sync/sync.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [ApiFootballModule, PrismaModule, SyncModule, NotificationsModule],
  controllers: [ZapScoreSentinelController],
  providers: [ZapScoreSentinelService, SentinelAlertService],
  exports: [ZapScoreSentinelService, SentinelAlertService],
})
export class SentinelModule {}

