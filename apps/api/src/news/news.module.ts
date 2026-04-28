import { Module } from '@nestjs/common';
import { NewsService } from './news.service';
import { NewsController } from './news.controller';
import { PrismaModule } from '../prisma/prisma.module';

import { HttpModule } from '@nestjs/axios';
import { NewsCrawlerService } from './news-crawler.service';

@Module({
  imports: [PrismaModule, HttpModule],
  controllers: [NewsController],
  providers: [NewsService, NewsCrawlerService],
  exports: [NewsCrawlerService],
})
export class NewsModule {}
