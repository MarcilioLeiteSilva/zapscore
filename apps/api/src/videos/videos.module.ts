import { Module } from '@nestjs/common';
import { VideosService } from './videos.service';
import { VideosController } from './videos.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { HttpModule } from '@nestjs/axios';
import { VideoCrawlerService } from './video-crawler.service';

@Module({
  imports: [PrismaModule, HttpModule],
  controllers: [VideosController],
  providers: [VideosService, VideoCrawlerService],
  exports: [VideoCrawlerService],
})
export class VideosModule {}
