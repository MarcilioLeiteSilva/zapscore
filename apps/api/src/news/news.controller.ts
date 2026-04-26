import { Controller, Get, Param, Query, Post, Body, Put, Delete } from '@nestjs/common';
import { NewsService } from './news.service';

@Controller('news')
export class NewsController {
  constructor(private readonly newsService: NewsService) {}

  @Get()
  async findAll(@Query() query: { leagueId?: string; teamId?: string }) {
    return this.newsService.findAll(query);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.newsService.findOne(id);
  }

  @Post()
  async create(@Body() data: any) {
    return this.newsService.create(data);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() data: any) {
    return this.newsService.update(id, data);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.newsService.remove(id);
  }
}
