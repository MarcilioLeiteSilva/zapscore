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
      // Query 1: Focada em Gols e Melhores Momentos
      let searchQuery = `site:youtube.com ${query} gols melhores momentos`;
      let url = `https://news.google.com/rss/search?q=${encodeURIComponent(searchQuery)}&hl=pt-BR&gl=BR&ceid=BR:pt-419`;
      
      let response = await firstValueFrom(this.http.get(url));
      let items = this.parseRss(response.data);

      // Query 2: Fallback se a primeira falhar
      if (items.length === 0) {
        this.logger.debug(`No specific results for ${query}, trying broader search...`);
        searchQuery = `site:youtube.com ${query} futebol`;
        url = `https://news.google.com/rss/search?q=${encodeURIComponent(searchQuery)}&hl=pt-BR&gl=BR&ceid=BR:pt-419`;
        response = await firstValueFrom(this.http.get(url));
        items = this.parseRss(response.data);
      }
      
      this.logger.debug(`Found ${items.length} valid YouTube videos for ${query}`);
      
      let savedCount = 0;
      for (const item of items) {
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
        } catch (e) { }
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
    let totalFound = 0;

    while ((match = itemRegex.exec(xml)) !== null) {
      totalFound++;
      const content = match[1];
      const description = this.extractTag(content, 'description');
      const title = this.extractTag(content, 'title');
      let link = this.extractTag(content, 'link');
      
      // Log de debug para o primeiro item
      if (totalFound === 1) {
        this.logger.debug(`DEBUG SAMPLE - Link: ${link}`);
        this.logger.debug(`DEBUG SAMPLE - Desc: ${description.substring(0, 200)}`);
      }

      // Tentar extrair thumbnail do YouTube
      const imgMatch = /<img[^>]+src="([^">]+)"/g.exec(description);
      let thumbnailUrl = imgMatch ? imgMatch[1].replace(/^\/\//, 'https://') : null;

      // Extração de ID do YouTube - SUPER AGRESSIVA
      // Padrões: vi/ID, v=ID, embed/ID, shorts/ID, ou apenas o ID no final do link/descrição
      // O ID do YouTube sempre tem 11 caracteres
      const ytIdMatch = /(?:vi\/|v=|embed\/|shorts\/|youtube\.com\/watch\?v=|youtu\.be\/|articles\/)([a-zA-Z0-9_-]{11,})/.exec(thumbnailUrl || link || description);
      
      let videoId = null;
      if (ytIdMatch) {
        // Pegamos apenas os primeiros 11 caracteres se o match for maior
        videoId = ytIdMatch[1].substring(0, 11);
        link = `https://www.youtube.com/watch?v=${videoId}`;
        thumbnailUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
      } else if (link.includes('youtube.com') || link.includes('youtu.be')) {
         // Se o link já é do youtube mas não pegou no regex, tentamos um fallback simples
         const urlParts = link.split(/[v=/]/);
         videoId = urlParts.find(p => p.length === 11);
         if (videoId) {
            link = `https://www.youtube.com/watch?v=${videoId}`;
            thumbnailUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
         }
      }

      // Se não conseguimos um ID válido e o link não é explicitamente YouTube, ignoramos
      if (!videoId && !link.includes('youtube.com') && !link.includes('youtu.be')) {
        continue;
      }

      items.push({
        title: title.split(' - ')[0],
        link: link,
        pubDate: this.extractTag(content, 'pubDate'),
        description: description.replace(/<[^>]*>?/gm, '').trim(),
        thumbnailUrl: thumbnailUrl || (videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null),
      });
    }
    
    if (totalFound > 0 && items.length === 0) {
      this.logger.warn(`Found ${totalFound} RSS items but 0 were valid YouTube videos.`);
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
