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
    this.logger.log('Starting refined video crawl for 2026 season...');
    
    try {
      const leagues = await this.prisma.league.findMany();
      this.logger.log(`Found ${leagues.length} leagues to crawl videos for.`);
      
      for (const league of leagues) {
        // 1. Busca pela Competição 2026
        const countryContext = league.country ? ` ${league.country}` : '';
        await this.crawlVideosForQuery(`${league.name}${countryContext} 2026`, { leagueId: league.id });

        // 2. Busca pelos Times da Competição 2026 (Melhores momentos e gols)
        const teams = await this.prisma.team.findMany({
          where: {
            OR: [
              { homeFixtures: { some: { leagueId: league.id } } },
              { awayFixtures: { some: { leagueId: league.id } } }
            ]
          }
        });

        this.logger.debug(`Found ${teams.length} teams for league ${league.name}`);
        for (const team of teams) {
          await this.crawlVideosForQuery(`${team.name} 2026`, { leagueId: league.id, teamId: team.id });
        }
      }

      this.logger.log('Refined 2026 video crawl finished successfully.');
    } catch (err) {
      this.logger.error(`Global video crawl failed: ${err.message}`);
    }
  }

  private async crawlVideosForQuery(query: string, ids: { leagueId?: string; teamId?: string }) {
    this.logger.debug(`Crawling videos for query: ${query}`);
    try {
      // Query 1: Mais específica
      let searchQuery = `futebol ${query} melhores momentos gols`;
      let url = `https://news.google.com/rss/search?q=${encodeURIComponent(searchQuery)}+site:youtube.com&hl=pt-BR&gl=BR&ceid=BR:pt-419`;
      
      let response = await firstValueFrom(this.http.get(url));
      let xml = response.data;
      let items = this.parseRss(xml);

      // Se não encontrar nada, tenta uma busca mais genérica (sem "melhores momentos")
      if (items.length === 0) {
        this.logger.debug(`No specific results for ${query}, trying broader search...`);
        searchQuery = `${query} futebol youtube`;
        url = `https://news.google.com/rss/search?q=${encodeURIComponent(searchQuery)}&hl=pt-BR&gl=BR&ceid=BR:pt-419`;
        response = await firstValueFrom(this.http.get(url));
        xml = response.data;
        items = this.parseRss(xml);
      }
      this.logger.debug(`Found ${items.length} potential videos for ${query}`);
      
      let savedCount = 0;
      for (const item of items) {
        if (!item.link) continue;

        try {
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
          savedCount++;
        } catch (e) {
          // Ignorar duplicados ou erros de inserção
        }
      }
      if (savedCount > 0) {
        this.logger.log(`Saved ${savedCount} videos for ${query}`);
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
      const title = this.extractTag(content, 'title');
      let link = this.extractTag(content, 'link');
      
      // Tentar extrair thumbnail e ID do YouTube da descrição
      const imgMatch = /<img[^>]+src="([^">]+)"/g.exec(description);
      let thumbnailUrl = imgMatch ? imgMatch[1].replace(/^\/\//, 'https://') : null;

      // Se a thumbnail for do YouTube, podemos extrair o ID real do vídeo
      // Formatos comuns: i.ytimg.com/vi/ID/..., img.youtube.com/vi/ID/...
      const ytIdMatch = /(?:vi\/|v=)([a-zA-Z0-9_-]{11})/.exec(thumbnailUrl || link);
      
      if (ytIdMatch) {
        const videoId = ytIdMatch[1];
        link = `https://www.youtube.com/watch?v=${videoId}`;
        thumbnailUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
      } else if (!link.includes('youtube.com') && !link.includes('youtu.be')) {
        // Se não conseguimos identificar como YouTube, ignoramos
        continue;
      }

      items.push({
        title: title.split(' - ')[0], // Limpar nome do canal no título
        link: link,
        pubDate: this.extractTag(content, 'pubDate'),
        description: description.replace(/<[^>]*>?/gm, '').trim(),
        thumbnailUrl: thumbnailUrl,
      });
    }
    return items.slice(0, 10);
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
