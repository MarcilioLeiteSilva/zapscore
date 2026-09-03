import { Controller, Get, Post } from '@nestjs/common';
import { LineupsService } from './lineups.service';

@Controller('lineups')
export class LineupsController {
  constructor(private readonly lineupsService: LineupsService) {}

  @Get('status')
  getStatus() {
    return this.lineupsService.getStatus();
  }

  @Post('sync-now')
  async syncNow() {
    return this.lineupsService.syncUpcomingLineups();
  }
}
