import { Module } from '@nestjs/common';
import { NewsService } from './news.service';
import { NewsController } from './news.controller';
import { PrismaModule } from '../prisma/prisma.module';

import { HttpModule } from '@nestjs/axios';
import { NewsCrawlerService } from './news-crawler.service';
import { NewsSourceController } from './news-source.controller';

@Module({
  imports: [PrismaModule, HttpModule],
  controllers: [NewsController, NewsSourceController],
  providers: [NewsService, NewsCrawlerService],
  exports: [NewsCrawlerService],
})
export class NewsModule {}
