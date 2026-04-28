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
   * Formato: CBMi... (Protobuf Base64)
   */
  private decodeGoogleNewsUrl(googleUrl: string): string {
    try {
      if (!googleUrl.includes('articles/')) return googleUrl;
      
      const parts = googleUrl.split('articles/');
      let base64Part = parts[1].split('?')[0];
      
      // Ajuste de Base64Url
      base64Part = base64Part.replace(/-/g, '+').replace(/_/g, '/');
      while (base64Part.length % 4 !== 0) base64Part += '=';
      
      const buffer = Buffer.from(base64Part, 'base64');
      
      // O Protobuf do Google News geralmente tem a URL começando após os primeiros bytes de controle
      // Vamos procurar a primeira ocorrência de "http" no buffer
      const decodedStr = buffer.toString('utf-8');
      const httpIndex = decodedStr.indexOf('http');
      
      if (httpIndex !== -1) {
        // A URL termina antes de caracteres de controle binários (0x00-0x1F)
        let cleanedUrl = decodedStr.substring(httpIndex);
        const match = cleanedUrl.match(/^(https?:\/\/[a-zA-Z0-9\-\.\/\%\?\&\=\#\_\+]+)/);
        if (match) {
          this.logger.debug(`[DECODE] Success: ${match[1]}`);
          return match[1];
        }
      }
      return googleUrl;
    } catch (e) {
      return googleUrl;
    }
  }

  /**
   * Scraper Avançado via Cheerio: Extrai metadados profissionais (OG, Twitter, JSON-LD)
   */
  private async scrapeFullNewsData(url: string): Promise<{ title: string; description: string; image: string | null; source: string } | null> {
    try {
      // Se não conseguimos decodificar a URL e ela ainda é do Google, tentamos escapar uma vez
      if (url.includes('google.com')) {
          this.logger.debug(`[SCRAPE] Trying to escape Google: ${url}`);
          const response = await firstValueFrom(this.http.get(url, { 
            timeout: 5000,
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36' }
          }));
          const $ = cheerio.load(response.data);
          const refreshLink = $('meta[http-equiv="refresh"]').attr('content');
          const exitLink = refreshLink?.includes('url=') ? refreshLink.split('url=')[1] : $('a[href^="http"]').filter((_, el) => !$(el).attr('href')?.includes('google.com')).first().attr('href');
          
          if (exitLink && !exitLink.includes('google.com')) {
              return this.scrapeFullNewsData(exitLink);
          }
          return null; // Falhou em sair do Google
      }

      this.logger.debug(`[SCRAPE] Visiting Source: ${url}`);
      const response = await firstValueFrom(this.http.get(url, { 
        timeout: 8000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Referer': 'https://www.google.com/'
        }
      }));
      
      const $ = cheerio.load(response.data);
      
      // 1. Extrair Título
      const title = $('meta[property="og:title"]').attr('content') || 
                    $('meta[name="twitter:title"]').attr('content') || 
                    $('title').text();

      // 2. Extrair Descrição
      const description = $('meta[property="og:description"]').attr('content') || 
                          $('meta[name="twitter:description"]').attr('content') || 
                          $('meta[name="description"]').attr('content');

      // 3. Extrair Imagem
      let image: string | null = null;
      try {
        $('script[type="application/ld+json"]').each((_: any, el: any) => {
          const json = JSON.parse($(el).html() || '{}');
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
              if (obj.thumbnailUrl) return findImg(obj.thumbnailUrl);
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
                $('meta[name="twitter:image:src"]').attr('content') ||
                $('link[rel="preload"][as="image"]').attr('href') ||
                $('link[rel="image_src"]').attr('href') || null;
      }

      // Fallback: tentar achar a maior imagem no corpo da notícia
      if (!image) {
        $('article img, .article img, .content img, main img').each((_: any, el: any) => {
          const src = $(el).attr('src') || $(el).attr('data-src');
          if (src && src.startsWith('http') && !src.includes('logo') && !src.includes('icon') && !src.includes('avatar')) {
            image = src;
            return false; // Break
          }
          return true;
        });
      }

      // 4. Extrair Fonte
      let source = $('meta[property="og:site_name"]').attr('content') || 
                     new URL(url).hostname.replace('www.', '');
      
      if (source.toLowerCase().includes('google')) source = '';

      if (image && image.startsWith('//')) image = `https:${image}`;
      
      this.logger.debug(`[SCRAPE] Success: ${title}`);

      return { 
        title: title?.trim() || '', 
        description: description?.trim() || '', 
        image, 
        source: source?.trim() || '' 
      };
    } catch (error) {
      this.logger.debug(`[SCRAPE] Failed for ${url}: ${error.message}`);
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
        const realUrl = this.decodeGoogleNewsUrl(news.externalUrl);
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
