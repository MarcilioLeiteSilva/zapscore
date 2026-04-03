import { Controller, Get, Query } from '@nestjs/common';
import { FixturesService } from './fixtures.service';

@Controller('fixtures')
export class FixturesController {
  constructor(private readonly fixturesService: FixturesService) {}

  @Get('today')
  async findToday() {
    return this.fixturesService.findToday();
  }

  @Get()
  async findByDate(@Query('date') date: string) {
    if (date) {
      return this.fixturesService.findByDate(date);
    }
    return this.fixturesService.findToday();
  }
}
