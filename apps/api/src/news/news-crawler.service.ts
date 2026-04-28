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
        // Tentar buscar imagem de alta resolução diretamente no site da notícia
        let highResImage = this.forceHighResGoogleImage(item.imageUrl || '');
        try {
          const fetchedImage = await this.fetchHighResImage(item.link);
          if (fetchedImage) highResImage = fetchedImage;
        } catch (e) {
          this.logger.debug(`Could not fetch high-res image for ${item.link}: ${e.message}`);
        }

        // Usamos upsert com update vazio para evitar duplicados sem sobrescrever dados manuais
        await this.prisma.news.upsert({
          where: { externalUrl: item.link },
          update: { imageUrl: highResImage }, 
          create: {
            title: item.title,
            description: item.description,
            source: item.source,
            imageUrl: highResImage,
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
   * Acessa a URL da notícia e tenta extrair a imagem original (og:image)
   */
  private async fetchHighResImage(url: string): Promise<string | null> {
    try {
      // Timeout curto para não travar o processo (3 segundos)
      const response = await firstValueFrom(this.http.get(url, { 
        timeout: 4000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0.3 Mobile/15E148 Safari/604.1'
        }
      }));
      
      const html = response.data;
      const ogImageMatch = /<meta[^>]+property="og:image"[^>]+content="([^">]+)"/i.exec(html) || 
                           /<meta[^>]+content="([^">]+)"[^>]+property="og:image"/i.exec(html) ||
                           /<meta[^>]+name="twitter:image"[^>]+content="([^">]+)"/i.exec(html);

      if (ogImageMatch && ogImageMatch[1]) {
        let imageUrl = ogImageMatch[1];
        if (imageUrl.startsWith('//')) imageUrl = `https:${imageUrl}`;
        return this.forceHighResGoogleImage(imageUrl);
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Se for uma imagem do Google UserContent, força a resolução máxima
   */
  private forceHighResGoogleImage(url: string): string {
    if (url.includes('googleusercontent.com')) {
      // Remove parâmetros de redimensionamento (ex: =s0-w300-rw) e força =s0 (original)
      return url.split('=')[0] + '=s0';
    }
    return url;
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
      const description = this.extractTag(content, 'description');
      
      // Tentar extrair imagem da descrição (Google News coloca uma <img> lá)
      const imgMatch = /<img[^>]+src="([^">]+)"/g.exec(description);
      const imageUrl = imgMatch ? imgMatch[1].replace(/^\/\//, 'https://') : null;

      items.push({
        title: this.extractTag(content, 'title'),
        link: this.extractTag(content, 'link'),
        pubDate: this.extractTag(content, 'pubDate'),
        description: description.replace(/<[^>]*>?/gm, '').trim(), // Limpar HTML da descrição
        source: this.extractTag(content, 'source'),
        imageUrl: imageUrl,
      });
    }
    // Limitamos a 5 notícias por busca para não sobrecarregar
    return items.slice(0, 3); // Reduzi para 3 para compensar o tempo de fetch da imagem
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
