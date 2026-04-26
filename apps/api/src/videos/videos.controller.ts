import { Controller, Get, Param, Query, Post, Body, Put, Delete } from '@nestjs/common';
import { VideosService } from './videos.service';

@Controller('videos')
export class VideosController {
  constructor(private readonly videosService: VideosService) {}

  @Get()
  async findAll(@Query() query: { leagueId?: string; teamId?: string }) {
    return this.videosService.findAll(query);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.videosService.findOne(id);
  }

  @Post()
  async create(@Body() data: any) {
    return this.videosService.create(data);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() data: any) {
    return this.videosService.update(id, data);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.videosService.remove(id);
  }
}
