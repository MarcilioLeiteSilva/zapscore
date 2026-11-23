import { Module } from '@nestjs/common';
import { AdsController } from './ads.controller';
import { AdsService } from './ads.service';
import { AdsSchedulerService } from './ads-scheduler.service';
import { PocketbaseAdsClient } from './providers/pocketbase-ads.client';
import { GeoIpService } from './providers/geoip.service';

@Module({
  controllers: [AdsController],
  providers: [AdsService, AdsSchedulerService, PocketbaseAdsClient, GeoIpService],
  exports: [AdsService, PocketbaseAdsClient, GeoIpService],
})
export class AdsModule {}
