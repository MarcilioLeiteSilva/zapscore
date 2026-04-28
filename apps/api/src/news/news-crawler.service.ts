import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { PrismaService } from '../prisma/prisma.service';
import { firstValueFrom } from 'rxjs';
import * as cheerio from 'cheerio';

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
      this.logger.log(`[CRAWL] Searching news for: "${query}"`);
      const searchQuery = `${query} futebol`;
      const url = `https://news.google.com/rss/search?q=${encodeURIComponent(searchQuery)}&hl=pt-BR&gl=BR&ceid=BR:pt-419`;
      
      const response = await firstValueFrom(this.http.get(url, { timeout: 10000 }));
      const xml = response.data;

      const items = this.parseRss(xml);
      this.logger.log(`[RSS] Found ${items.length} items in RSS for "${query}"`);
      
      let newCount = 0;
      for (const item of items) {
        // Decodifica a URL real antes de fazer o scraping
        const realUrl = this.decodeGoogleNewsUrl(item.link);
        
        // Tentar buscar todos os dados da notícia diretamente no site de origem (Full Scraping)
        const fullData = await this.scrapeFullNewsData(realUrl);
        
        const finalTitle = fullData?.title || item.title;
        const finalDescription = fullData?.description || item.description;
        const finalImage = fullData?.image || item.imageUrl;
        const finalSource = fullData?.source || item.source;

        if (!finalTitle) continue;

        // Usamos upsert para evitar duplicados
        await this.prisma.news.upsert({
          where: { externalUrl: item.link },
          update: { 
            title: finalTitle,
            description: finalDescription,
            imageUrl: finalImage,
            source: finalSource
          }, 
          create: {
            title: finalTitle,
            description: finalDescription,
            source: finalSource,
            imageUrl: finalImage,
            externalUrl: item.link,
            createdAt: item.pubDate ? new Date(item.pubDate) : new Date(),
            ...ids
          }
        });
        newCount++;
      }
      
      if (newCount > 0) {
        this.logger.debug(`[SUCCESS] Processed ${newCount} news items for "${query}"`);
      }
    } catch (err) {
      this.logger.error(`[ERROR] Crawling news for ${query}: ${err.message}`);
    }
  }

  /**
   * Decodifica a URL real escondida nos links do Google News RSS
   */
  private decodeGoogleNewsUrl(googleUrl: string): string {
    try {
      if (!googleUrl.includes('articles/')) return googleUrl;
      
      const parts = googleUrl.split('articles/');
      let base64Part = parts[1].split('?')[0];
      
      base64Part = base64Part.replace(/-/g, '+').replace(/_/g, '/');
      const buffer = Buffer.from(base64Part, 'base64');
      const decoded = buffer.toString('binary'); 
      
      const urlMatch = decoded.match(/(https?:\/\/[^\s\x00-\x1F\x7F]+)/);
      
      if (urlMatch) {
        const cleanedUrl = urlMatch[1].replace(/[^\w\d\/\.\:\?\&\=\-\%\+_].*$/, '');
        return cleanedUrl;
      }
      return googleUrl;
    } catch (e) {
      return googleUrl;
    }
  }

  /**
   * ROBÔ REPARADOR: Percorre as notícias do banco e tenta dar um "upgrade" nos dados
   */
  async repairNewsData() {
    this.logger.log('Starting News Repairer Robot...');
    
    const newsToRepair = await this.prisma.news.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    this.logger.log(`Scanning ${newsToRepair.length} news items for potential repairs...`);

    let repairedCount = 0;
    for (const news of newsToRepair) {
      if (news.externalUrl) {
        const realUrl = this.decodeGoogleNewsUrl(news.externalUrl);
        const fullData = await this.scrapeFullNewsData(realUrl);
        
        if (fullData && (fullData.image || fullData.title)) {
          await this.prisma.news.update({
            where: { id: news.id },
            data: {
              title: fullData.title || news.title,
              description: fullData.description || news.description,
              imageUrl: fullData.image || news.imageUrl,
              source: fullData.source || news.source
            }
          });
          repairedCount++;
          this.logger.debug(`[REPAIR] Updated: ${fullData.title}`);
        }
      }
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    this.logger.log(`News Repairer finished. Total repaired: ${repairedCount}`);
  }

  /**
   * Scraper Avançado via Cheerio: Extrai metadados profissionais (OG, Twitter, JSON-LD)
   */
  private async scrapeFullNewsData(url: string) {
    try {
      this.logger.debug(`[SCRAPE] Visiting: ${url}`);
      const response = await firstValueFrom(this.http.get(url, { 
        timeout: 8000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
          'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
          'Referer': 'https://www.google.com/'
        }
      }));
      
      const $ = cheerio.load(response.data);
      
      // 1. Extrair Título
      const title = $('meta[property="og:title"]').attr('content') || 
                    $('meta[name="twitter:title"]').attr('content') || 
                    $('title').text() || 
                    $('h1').first().text();

      // 2. Extrair Descrição
      const description = $('meta[property="og:description"]').attr('content') || 
                          $('meta[name="twitter:description"]').attr('content') || 
                          $('meta[name="description"]').attr('content');

      // 3. Extrair Imagem (A parte mais importante)
      let image = null;

      // Prioridade A: JSON-LD (Muitos sites usam para imagens de alta resolução)
      try {
        $('script[type="application/ld+json"]').each((_, el) => {
          const json = JSON.parse($(el).html() || '{}');
          if (json.image) {
            if (typeof json.image === 'string') image = json.image;
            else if (Array.isArray(json.image)) image = json.image[0];
            else if (json.image.url) image = json.image.url;
          }
          if (image) return false; // Break loop
        });
      } catch (e) {}

      // Prioridade B: OpenGraph / Twitter
      if (!image) {
        image = $('meta[property="og:image"]').attr('content') || 
                $('meta[name="twitter:image"]').attr('content') ||
                $('link[rel="image_src"]').attr('href');
      }

      // 4. Extrair Fonte
      const source = $('meta[property="og:site_name"]').attr('content') || 
                     (url.startsWith('http') ? new URL(url).hostname.replace('www.', '') : null);

      // Tratamento final da URL da imagem
      if (image && image.startsWith('//')) image = `https:${image}`;
      if (image && image.includes('googleusercontent.com')) image = this.forceHighResGoogleImage(image);

      this.logger.debug(`[SCRAPE] Success: Title=${!!title}, Image=${!!image}`);

      return { 
        title: title?.trim(), 
        description: description?.trim(), 
        image, 
        source: source?.trim() 
      };
    } catch (error) {
      this.logger.debug(`[SCRAPE] Failed for ${url}: ${error.message}`);
      return null;
    }
  }

  /**
   * Decode HTML entities comuns
   */
  private decodeHtmlEntities(text: string): string {
    if (!text) return '';
    return text.replace(/&amp;/g, '&')
               .replace(/&lt;/g, '<')
               .replace(/&gt;/g, '>')
               .replace(/&quot;/g, '"')
               .replace(/&#39;/g, "'")
               .replace(/&nbsp;/g, ' ')
               .replace(/&ndash;/g, '-')
               .replace(/&mdash;/g, '-');
  }

  private forceHighResGoogleImage(url: string): string {
    if (url.includes('googleusercontent.com')) {
      return url.split('=')[0] + '=s0';
    }
    return url;
  }

  /**
   * Decode HTML entities comuns
   */
  private decodeHtmlEntities(text: string): string {
    if (!text) return '';
    return text.replace(/&amp;/g, '&')
               .replace(/&lt;/g, '<')
               .replace(/&gt;/g, '>')
               .replace(/&quot;/g, '"')
               .replace(/&#39;/g, "'")
               .replace(/&nbsp;/g, ' ')
               .replace(/&ndash;/g, '-')
               .replace(/&mdash;/g, '-');
  }

  private forceHighResGoogleImage(url: string): string {
    if (url.includes('googleusercontent.com')) {
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
