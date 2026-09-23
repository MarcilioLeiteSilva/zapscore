import { Module } from '@nestjs/common';
import { AdsController } from './ads.controller';
import { AdsService } from './ads.service';
import { AdsSchedulerService } from './ads-scheduler.service';
import { PocketbaseAdsClient } from './providers/pocketbase-ads.client';

@Module({
  controllers: [AdsController],
  providers: [AdsService, AdsSchedulerService, PocketbaseAdsClient],
  exports: [AdsService, PocketbaseAdsClient],
})
export class AdsModule {}
