import { Controller, Get, Post, Body, Delete, Param, Put, Query } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('news-sources')
export class NewsSourceController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async findAll() {
    return this.prisma.newsSource.findMany({
      orderBy: { name: 'asc' }
    });
  }

  @Post()
  async create(@Body() data: { name: string; url: string; domain?: string }) {
    return this.prisma.newsSource.create({
      data: {
        name: data.name,
        url: data.url,
        domain: data.domain || new URL(data.url).hostname.replace('www.', ''),
        active: true
      }
    });
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() data: { active?: boolean; name?: string; url?: string }) {
    return this.prisma.newsSource.update({
      where: { id },
      data: {
        ...(data.active !== undefined && { active: data.active }),
        ...(data.name && { name: data.name }),
        ...(data.url && { url: data.url, domain: new URL(data.url).hostname.replace('www.', '') }),
      }
    });
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.prisma.newsSource.delete({
      where: { id }
    });
  }
}
