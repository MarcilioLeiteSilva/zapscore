import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  UseInterceptors,
  UploadedFile,
  Res,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { AdsService } from './ads.service';
import { AdPlacement, AdStatus, UploadedCreativeFile } from './interfaces/ads.types';

@Controller('ads')
export class AdsController {
  constructor(private readonly adsService: AdsService) {}

  /**
   * ==========================================
   * ENDPOINTS PÚBLICOS PARA APPS FLUTTER
   * ==========================================
   */

  @Get('serve')
  async serveAd(
    @Query('app') app: string,
    @Query('placement') placement: AdPlacement,
    @Query('leagueId') leagueId?: string,
  ) {
    const parsedLeagueId = leagueId ? parseInt(leagueId, 10) : undefined;
    const ad = await this.adsService.serveAd({
      app: app || 'all',
      placement: placement || 'banner_bottom',
      leagueId: isNaN(parsedLeagueId as number) ? undefined : parsedLeagueId,
    });

    return {
      success: true,
      hasAd: !!ad,
      ad: ad || null,
    };
  }

  @Post(':id/impression')
  async trackImpression(
    @Param('id') id: string,
    @Body() body: { appSlug?: string; leagueId?: number },
  ) {
    await this.adsService.recordImpression(id, body.appSlug || '', body.leagueId);
    return { success: true };
  }

  @Post(':id/click')
  async trackClick(
    @Param('id') id: string,
    @Body() body: { appSlug?: string; leagueId?: number },
  ) {
    const destinationUrl = await this.adsService.recordClick(id, body.appSlug || '', body.leagueId);
    return { success: true, destinationUrl };
  }

  /**
   * ==========================================
   * ENDPOINTS OPERACIONAIS (ADMINPANEL)
   * ==========================================
   */

  @Get('dashboard')
  async getDashboard() {
    const metrics = await this.adsService.getDashboardMetrics();
    return {
      success: true,
      data: metrics,
    };
  }

  @Get('inventory')
  async getInventory() {
    const inventory = await this.adsService.getInventoryMap();
    return {
      success: true,
      data: inventory,
    };
  }

  @Get('campaigns')
  async listCampaigns(
    @Query('status') status?: string,
    @Query('advertiser') advertiser?: string,
    @Query('placement') placement?: string,
  ) {
    const campaigns = await this.adsService.listCampaigns({ status, advertiser, placement });
    return {
      success: true,
      data: campaigns,
    };
  }

  @Get('campaigns/:id')
  async getCampaign(@Param('id') id: string) {
    const campaign = await this.adsService.getCampaign(id);
    return {
      success: true,
      data: campaign,
    };
  }

  @Post('campaigns')
  @UseInterceptors(FileInterceptor('creative'))
  async createCampaign(
    @UploadedFile() file: UploadedCreativeFile,
    @Body() body: any,
  ) {
    let targetApps = body.target_apps;
    if (typeof targetApps === 'string') {
      try {
        targetApps = JSON.parse(targetApps);
      } catch {
        targetApps = [targetApps];
      }
    }

    let targetLeagues = body.target_leagues;
    if (typeof targetLeagues === 'string') {
      try {
        targetLeagues = JSON.parse(targetLeagues);
      } catch {
        targetLeagues = [];
      }
    }

    const payload = {
      ...body,
      target_apps: targetApps,
      target_leagues: targetLeagues,
      priority: body.priority ? parseInt(body.priority, 10) : 1,
      max_impressions: body.max_impressions ? parseInt(body.max_impressions, 10) : 0,
    };

    const campaign = await this.adsService.createCampaign(payload, file);
    return {
      success: true,
      data: campaign,
    };
  }

  @Put('campaigns/:id')
  @UseInterceptors(FileInterceptor('creative'))
  async updateCampaign(
    @Param('id') id: string,
    @UploadedFile() file: UploadedCreativeFile,
    @Body() body: any,
  ) {
    let targetApps = body.target_apps;
    if (typeof targetApps === 'string') {
      try {
        targetApps = JSON.parse(targetApps);
      } catch {
        targetApps = [targetApps];
      }
    }

    let targetLeagues = body.target_leagues;
    if (typeof targetLeagues === 'string') {
      try {
        targetLeagues = JSON.parse(targetLeagues);
      } catch {
        targetLeagues = [];
      }
    }

    const payload = {
      ...body,
      ...(targetApps !== undefined ? { target_apps: targetApps } : {}),
      ...(targetLeagues !== undefined ? { target_leagues: targetLeagues } : {}),
      ...(body.priority !== undefined ? { priority: parseInt(body.priority, 10) } : {}),
      ...(body.max_impressions !== undefined ? { max_impressions: parseInt(body.max_impressions, 10) } : {}),
    };

    const campaign = await this.adsService.updateCampaign(id, payload, file);
    return {
      success: true,
      data: campaign,
    };
  }

  @Patch('campaigns/:id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: AdStatus,
  ) {
    const success = await this.adsService.updateStatus(id, status);
    return { success };
  }

  @Delete('campaigns/:id')
  async deleteCampaign(@Param('id') id: string) {
    const success = await this.adsService.deleteCampaign(id);
    return { success };
  }
}
