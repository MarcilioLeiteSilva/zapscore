import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { PrismaService } from '../prisma/prisma.service';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class NewsCrawlerService {
  private readonly logger = new Logger(NewsCrawlerService.name);

  constructor(
    private readonly http: HttpService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Sincroniza notícias para todas as competições e times ativos
   */
  async syncAllNews() {
    this.logger.log('Starting full news crawl from Google News RSS...');
    
    try {
      // 1. Sincronizar notícias de competições
      const leagues = await this.prisma.league.findMany();
      this.logger.log(`Found ${leagues.length} leagues to crawl news for.`);
      for (const league of leagues) {
        await this.crawlNewsForQuery(league.name, { leagueId: league.id });
      }

      // 2. Sincronizar notícias de clubes
      const teams = await this.prisma.team.findMany({
        where: { national: false } // Focar em clubes primeiro
      });
      this.logger.log(`Found ${teams.length} teams to crawl news for.`);
      for (const team of teams) {
         await this.crawlNewsForQuery(team.name, { teamId: team.id });
      }

      this.logger.log('News crawl finished successfully.');
    } catch (err) {
      this.logger.error(`Global news crawl failed: ${err.message}`);
    }
  }

  /**
   * Busca notícias no RSS do Google e salva no banco
   */
  private async crawlNewsForQuery(query: string, ids: { leagueId?: string; teamId?: string; playerId?: string }) {
    try {
      // Filtramos por futebol para maior precisão
      const searchQuery = `${query} futebol`;
      const url = `https://news.google.com/rss/search?q=${encodeURIComponent(searchQuery)}&hl=pt-BR&gl=BR&ceid=BR:pt-419`;
      
      const response = await firstValueFrom(this.http.get(url));
      const xml = response.data;

      const items = this.parseRss(xml);
      
      let newCount = 0;
      for (const item of items) {
        // Usamos upsert com update vazio para evitar duplicados sem sobrescrever dados manuais
        await this.prisma.news.upsert({
          where: { externalUrl: item.link },
          update: {}, 
          create: {
            title: item.title,
            description: item.description,
            source: item.source,
            externalUrl: item.link,
            createdAt: item.pubDate ? new Date(item.pubDate) : new Date(),
            ...ids
          }
        });
        newCount++;
      }
      
      if (newCount > 0) {
        this.logger.debug(`Processed ${newCount} news items for "${query}"`);
      }
    } catch (err) {
      this.logger.error(`Error crawling news for ${query}: ${err.message}`);
    }
  }

  /**
   * Parser simples de RSS via Regex (Evita dependências extras)
   */
  private parseRss(xml: string) {
    const items = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;

    while ((match = itemRegex.exec(xml)) !== null) {
      const content = match[1];
      items.push({
        title: this.extractTag(content, 'title'),
        link: this.extractTag(content, 'link'),
        pubDate: this.extractTag(content, 'pubDate'),
        description: this.extractTag(content, 'description'),
        source: this.extractTag(content, 'source'),
      });
    }
    // Limitamos a 5 notícias por busca para não sobrecarregar
    return items.slice(0, 5);
  }

  private extractTag(content: string, tag: string) {
    const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\/${tag}>`);
    const match = regex.exec(content);
    if (!match) return '';
    
    let text = match[1];
    // Remove CDATA
    text = text.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1');
    // Decode HTML entities básicas
    text = text.replace(/&amp;/g, '&')
               .replace(/&lt;/g, '<')
               .replace(/&gt;/g, '>')
               .replace(/&quot;/g, '"')
               .replace(/&#39;/g, "'");
               
    return text.trim();
  }
}
