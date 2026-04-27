import { Controller, Get, Param, Query, ParseIntPipe } from '@nestjs/common';
import { PlayersService } from './players.service';

@Controller('players')
export class PlayersController {
  constructor(private readonly playersService: PlayersService) {}

  @Get(':id')
  async getPlayerDetails(
    @Param('id', ParseIntPipe) id: number,
    @Query('season', new ParseIntPipe({ optional: true })) season?: number,
  ) {
    return this.playersService.getPlayerDetails(id, season || 2026);
  }
}
