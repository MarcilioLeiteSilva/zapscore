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
        const realUrl = await this.resolveGoogleNewsUrl(item.link);
        
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
   * Resolve a URL real do Google News seguindo o redirecionamento
   */
  private async resolveGoogleNewsUrl(googleUrl: string): Promise<string> {
    try {
      if (!googleUrl.includes('articles/')) return googleUrl;
      
      this.logger.debug(`[RESOLVE] Following: ${googleUrl.substring(0, 50)}...`);
      const response = await firstValueFrom(this.http.get(googleUrl, { 
        maxRedirects: 5,
        headers: {
          'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1'
        }
      }));
      
      // O link final após os redirecionamentos
      const finalUrl = response.request.res.responseUrl || googleUrl;
      
      if (finalUrl.includes('google.com/consent') || finalUrl.includes('accounts.google.com')) {
          console.log(`[RESOLVE] Stuck on Google Consent page`);
          return googleUrl;
      }

      console.log(`[RESOLVE] Resolved to: ${finalUrl}`);
      return finalUrl;
    } catch (e) {
      this.logger.error(`[RESOLVE] Failed: ${e.message}`);
      return googleUrl;
    }
  }

  /**
   * Scraper Avançado via Cheerio: Extrai metadados profissionais (OG, Twitter, JSON-LD)
   */
  private async scrapeFullNewsData(url: string): Promise<{ title: string; description: string; image: string | null; source: string } | null> {
    try {
      if (url.includes('google.com')) {
          console.log(`[SCRAPE] Escaping Google: ${url.substring(0, 50)}...`);
          const response = await firstValueFrom(this.http.get(url, { 
            timeout: 5000,
            headers: { 'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1' }
          }));
          const $ = cheerio.load(response.data);
          const refreshLink = $('meta[http-equiv="refresh"]').attr('content');
          const exitLink = refreshLink?.includes('url=') ? refreshLink.split('url=')[1] : $('a[href^="http"]').filter((_, el) => !$(el).attr('href')?.includes('google.com')).first().attr('href');
          
          if (exitLink && !exitLink.includes('google.com')) {
              return this.scrapeFullNewsData(exitLink);
          }
          console.log(`[SCRAPE] Failed to escape Google`);
          return null;
      }

      console.log(`[SCRAPE] Fetching Source: ${url}`);
      const response = await firstValueFrom(this.http.get(url, { 
        timeout: 8000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'pt-BR,pt;q=0.9'
        }
      }));
      
      const html = response.data;
      console.log(`[SCRAPE] HTML Preview (500 chars): ${html.substring(0, 500).replace(/\n/g, ' ')}`);
      
      const $ = cheerio.load(html);
      
      const title = $('meta[property="og:title"]').attr('content') || 
                    $('meta[name="twitter:title"]').attr('content') || 
                    $('title').text();

      const description = $('meta[property="og:description"]').attr('content') || 
                          $('meta[name="twitter:description"]').attr('content') || 
                          $('meta[name="description"]').attr('content');

      let image: string | null = null;
      // JSON-LD deep search
      try {
        $('script[type="application/ld+json"]').each((_: any, el: any) => {
          const jsonStr = $(el).html() || '{}';
          const json = JSON.parse(jsonStr);
          const findImg = (obj: any): string | null => {
              if (!obj) return null;
              if (typeof obj === 'string' && obj.startsWith('http')) return obj;
              if (Array.isArray(obj)) {
                  for (const item of obj) {
                      const res = findImg(item);
                      if (res) return res;
                  }
              }
              if (obj.url) return findImg(obj.url);
              if (obj.image) return findImg(obj.image);
              return null;
          };
          image = findImg(json);
          if (image) return false;
          return true;
        });
      } catch (e) {}

      if (!image) {
        image = $('meta[property="og:image"]').attr('content') || 
                $('meta[name="twitter:image"]').attr('content') ||
                $('link[rel="preload"][as="image"]').attr('href') || 
                $('link[rel="icon"]').attr('href') || null;
      }

      let source = $('meta[property="og:site_name"]').attr('content') || 
                     new URL(url).hostname.replace('www.', '');
      
      if (source.toLowerCase().includes('google')) source = '';

      console.log(`[SCRAPE] Found: Title=${!!title}, Image=${!!image}, Source=${source}`);

      return { 
        title: title?.trim() || '', 
        description: description?.trim() || '', 
        image, 
        source: source?.trim() || '' 
      };
    } catch (error) {
      console.log(`[SCRAPE] ERROR for ${url}: ${error.message}`);
      return null;
    }
  }

  /**
   * ROBÔ REPARADOR: Percorre as notícias do banco e tenta dar um "upgrade" nos dados
   */
  async repairNewsData(): Promise<{ message: string; repaired: number; total: number }> {
    console.log('[REPAIR] Starting News Repairer Robot...');
    this.logger.log('Starting News Repairer Robot...');
    
    const newsToRepair = await this.prisma.news.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    console.log(`[REPAIR] Found ${newsToRepair.length} items to process`);
    this.logger.log(`Scanning ${newsToRepair.length} news items...`);

    let repairedCount = 0;
    for (const news of newsToRepair) {
      if (news.externalUrl) {
        const realUrl = await this.resolveGoogleNewsUrl(news.externalUrl);
        console.log(`[REPAIR] Decoded URL: ${realUrl.substring(0, 80)}`);
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
          console.log(`[REPAIR] Updated: ${fullData.title?.substring(0, 60)}`);
        }
      }
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    const msg = `Repair finished. Repaired ${repairedCount} of ${newsToRepair.length}`;
    console.log(`[REPAIR] ${msg}`);
    this.logger.log(msg);
    return { message: msg, repaired: repairedCount, total: newsToRepair.length };
  }

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
   * Parser simples de RSS via Regex
   */
  private parseRss(xml: string) {
    const items = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;

    while ((match = itemRegex.exec(xml)) !== null) {
      const content = match[1];
      const description = this.extractTag(content, 'description');
      
      const imgMatch = /<img[^>]+src="([^">]+)"/g.exec(description);
      const imageUrl = imgMatch ? imgMatch[1].replace(/^\/\//, 'https://') : null;

      items.push({
        title: this.extractTag(content, 'title'),
        link: this.extractTag(content, 'link'),
        pubDate: this.extractTag(content, 'pubDate'),
        description: description.replace(/<[^>]*>?/gm, '').trim(),
        source: this.extractTag(content, 'source'),
        imageUrl: imageUrl,
      });
    }
    return items.slice(0, 20);
  }

  private extractTag(content: string, tag: string) {
    const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\/${tag}>`);
    const match = regex.exec(content);
    if (!match) return '';
    
    let text = match[1];
    text = text.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1');
    return this.decodeHtmlEntities(text.trim());
  }
}
