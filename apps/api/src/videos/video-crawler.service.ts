import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { PrismaService } from '../prisma/prisma.service';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class VideoCrawlerService {
  private readonly logger = new Logger(VideoCrawlerService.name);

  constructor(
    private readonly http: HttpService,
    private readonly prisma: PrismaService,
  ) {}

  async syncAllVideos() {
    this.logger.log('Starting full video crawl from YouTube/Google RSS...');
    
    try {
      // 1. Sincronizar vídeos de competições
      const leagues = await this.prisma.league.findMany();
      for (const league of leagues) {
        await this.crawlVideosForQuery(league.name, { leagueId: league.id });
      }

      // 2. Sincronizar vídeos de clubes
      const teams = await this.prisma.team.findMany({
        where: { national: false }
      });
      for (const team of teams) {
         await this.crawlVideosForQuery(team.name, { teamId: team.id });
      }

      this.logger.log('Video crawl finished successfully.');
    } catch (err) {
      this.logger.error(`Global video crawl failed: ${err.message}`);
    }
  }

  private async crawlVideosForQuery(query: string, ids: { leagueId?: string; teamId?: string }) {
    try {
      // Buscamos especificamente por youtube e termos de futebol
      const searchQuery = `${query} melhores momentos gols youtube`;
      const url = `https://news.google.com/rss/search?q=${encodeURIComponent(searchQuery)}&hl=pt-BR&gl=BR&ceid=BR:pt-419`;
      
      const response = await firstValueFrom(this.http.get(url));
      const xml = response.data;

      const items = this.parseRss(xml);
      
      for (const item of items) {
        // Apenas vídeos do YouTube
        if (!item.link.includes('youtube.com') && !item.link.includes('youtu.be')) continue;

        await this.prisma.video.upsert({
          where: { videoUrl: item.link },
          update: { thumbnailUrl: item.thumbnailUrl }, 
          create: {
            title: item.title,
            description: item.description,
            thumbnailUrl: item.thumbnailUrl,
            videoUrl: item.link,
            createdAt: item.pubDate ? new Date(item.pubDate) : new Date(),
            ...ids
          }
        });
      }
    } catch (err) {
      this.logger.error(`Error crawling videos for ${query}: ${err.message}`);
    }
  }

  private parseRss(xml: string) {
    const items = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;

    while ((match = itemRegex.exec(xml)) !== null) {
      const content = match[1];
      const description = this.extractTag(content, 'description');
      
      // Tentar extrair thumbnail (Google News RSS costuma ter no img tag da descrição)
      const imgMatch = /<img[^>]+src="([^">]+)"/g.exec(description);
      const thumbnailUrl = imgMatch ? imgMatch[1].replace(/^\/\//, 'https://') : null;

      items.push({
        title: this.extractTag(content, 'title'),
        link: this.extractTag(content, 'link'),
        pubDate: this.extractTag(content, 'pubDate'),
        description: description.replace(/<[^>]*>?/gm, '').trim(),
        thumbnailUrl: thumbnailUrl,
      });
    }
    return items.slice(0, 5);
  }

  private extractTag(content: string, tag: string) {
    const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\/${tag}>`);
    const match = regex.exec(content);
    if (!match) return '';
    let text = match[1];
    text = text.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1');
    text = text.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
    return text.trim();
  }
}
