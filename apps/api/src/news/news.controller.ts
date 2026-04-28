import { Controller, Get, Param, Query, Post, Body, Put, Delete, Res, Logger } from '@nestjs/common';
import { NewsService } from './news.service';
import { HttpService } from '@nestjs/axios';
import { Response } from 'express';
import { firstValueFrom } from 'rxjs';

@Controller('news')
export class NewsController {
  private readonly logger = new Logger(NewsController.name);

  constructor(
    private readonly newsService: NewsService,
    private readonly http: HttpService,
  ) {}

  @Get('proxy-image')
  async proxyImage(@Query('url') url: string, @Res() res: Response) {
    if (!url) return res.status(400).send('URL is required');

    try {
      this.logger.debug(`[PROXY] Fetching image: ${url}`);
      const response = await firstValueFrom(this.http.get(url, {
        responseType: 'arraybuffer',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36',
          'Referer': new URL(url).origin
        }
      }));

      const contentType = response.headers['content-type'];
      res.setHeader('Content-Type', contentType || 'image/jpeg');
      res.setHeader('Cache-Control', 'public, max-age=86400'); // 24h cache
      return res.send(Buffer.from(response.data));
    } catch (e) {
      this.logger.error(`[PROXY] Failed to proxy image: ${e.message}`);
      return res.status(500).send('Failed to fetch image');
    }
  }

  @Get()
  async findAll(@Query() query: { leagueId?: string; teamId?: string; limit?: string }) {
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
