import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { PrismaService } from '../prisma/prisma.service';
import { firstValueFrom } from 'rxjs';
import * as cheerio from 'cheerio';

@Injectable()
export class NewsCrawlerService {
  private readonly logger = new Logger(NewsCrawlerService.name);

  private readonly TRUSTED_SOURCES = [
    { name: 'GE', url: 'https://ge.globo.com/rss/ge/futebol/', domain: 'ge.globo.com' },
    { name: 'Trivela', url: 'https://trivela.com.br/feed/', domain: 'trivela.com.br' },
    { name: 'UOL', url: 'https://noticias.uol.com.br/esporte/futebol/index.xml', domain: 'uol.com.br' },
    { name: 'CBF', url: 'https://www.cbf.com.br/futebol-brasileiro/noticias/rss', domain: 'cbf.com.br' },
    { name: 'Lance!', url: 'https://www.lance.com.br/rss/futebol', domain: 'lance.com.br' },
    { name: 'Gazeta Esportiva', url: 'https://www.gazetaesportiva.com/feed/', domain: 'gazetaesportiva.com' },
    { name: 'Terra', url: 'https://www.terra.com.br/rss/esportes/futebol/', domain: 'terra.com.br' },
    { name: 'Itatiaia', url: 'https://www.itatiaia.com.br/rss', domain: 'itatiaia.com.br' }
  ];

  private teams: any[] = [];
  private leagues: any[] = [];

  constructor(
    private readonly http: HttpService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Carrega times e ligas do banco para o classificador
   */
  private async initClassificationData() {
    this.teams = await this.prisma.team.findMany({ select: { id: true, name: true } });
    this.leagues = await this.prisma.league.findMany({ select: { id: true, name: true } });
    this.logger.log(`[CLASSIFIER] Loaded ${this.teams.length} teams and ${this.leagues.length} leagues for classification.`);
  }

  /**
   * Tenta encontrar time ou liga no texto da notícia
   */
  private classifyNews(title: string, description: string): { teamId: string | null; leagueId: string | null } {
    const text = `${title} ${description}`.toLowerCase();
    let teamId = null;
    let leagueId = null;

    // Busca Time (Ordenamos por tamanho de nome para evitar falsos positivos com nomes curtos dentro de nomes longos)
    const sortedTeams = [...this.teams].sort((a, b) => b.name.length - a.name.length);
    for (const team of sortedTeams) {
      const name = team.name.toLowerCase();
      // Se o nome for longo, buscamos ele todo. Se for curto (ex: Avaí), buscamos com espaços ou no início.
      if (name.length > 4) {
        if (text.includes(name)) {
          teamId = team.id;
          break;
        }
      } else {
        const regex = new RegExp(`\\b${name}\\b`, 'i');
        if (regex.test(text)) {
          teamId = team.id;
          break;
        }
      }
    }

    // Busca Liga
    for (const league of this.leagues) {
      const name = league.name.toLowerCase();
      if (text.includes(name)) {
        leagueId = league.id;
        break;
      }
      
      // Fallbacks comuns para ligas brasileiras
      if (name === 'serie a' && (text.includes('brasileirão') || text.includes('série a'))) leagueId = league.id;
      if (name === 'serie b' && (text.includes('série b'))) leagueId = league.id;
    }

    return { teamId, leagueId };
  }

  /**
   * Sincroniza notícias usando apenas fontes diretas (Whitelist)
   */
  async syncAllNews() {
    this.logger.log('Starting Clean News Engine (Direct Sources Only)...');
    
    try {
      // 0. Inicializa dados de classificação
      await this.initClassificationData();

      // 1. FAXINA: Deleta tudo que está sem imagem OU sem vínculo com time/liga
      const purge = await this.prisma.news.deleteMany({
        where: {
          OR: [
            { imageUrl: null },
            { imageUrl: '' },
            { imageUrl: { startsWith: 'data:image' } },
            { AND: [{ teamId: null }, { leagueId: null }] } // NOVO: Remove notícias sem vínculo
          ]
        }
      });
      if (purge.count > 0) {
        this.logger.log(`[PURGE] Removed ${purge.count} news items without valid images.`);
      }

      // 2. BUSCAR FONTES: Lê do banco de dados (NewsSource)
      let sources = await this.prisma.newsSource.findMany({
        where: { active: true }
      });

      // Se o banco estiver vazio, usamos as fontes fixas iniciais
      if (sources.length === 0) {
        this.logger.log('[SOURCE] DB empty. Using initial trusted sources fallback.');
        sources = this.TRUSTED_SOURCES as any[];
      }

      for (const source of sources) {
        this.logger.log(`[SOURCE] Syncing from ${source.name}...`);
        await this.syncFromDirectRss(source as any);
        
        // Atualiza data do último sync se a fonte for do banco
        if (source.id) {
          await this.prisma.newsSource.update({
            where: { id: source.id },
            data: { lastSync: new Date() }
          }).catch(() => {});
        }
      }

      this.logger.log('Clean News Engine finished successfully.');
    } catch (err) {
      this.logger.error(`Global news sync failed: ${err.message}`);
    }
  }

  /**
   * Coleta notícias diretamente de um RSS de portal (Sem redirecionamento do Google)
   */
  private async syncFromDirectRss(source: { name: string; url: string; domain: string }) {
    try {
      const response = await firstValueFrom(this.http.get(source.url, { timeout: 10000 }));
      const items = this.parseRss(response.data);
      this.logger.log(`[RSS] Found ${items.length} items for ${source.name}`);

      for (const item of items) {
        // Filtro de Ano (Opcional: se o título tiver um ano diferente de 2026, ignoramos)
        // Mas o mais seguro é olhar a data de publicação (pubDate)
        const itemDate = item.pubDate ? new Date(item.pubDate) : new Date();
        const itemYear = itemDate.getFullYear();

        // Se a notícia for muito velha (ex: 2025 pra trás), pulamos se o título não tiver "2026"
        if (itemYear < 2026 && !item.title.includes('2026')) {
           continue;
        }

        const fullData = await this.scrapeFullNewsData(item.link);
        
        const finalTitle = fullData?.title || item.title;
        const finalDescription = fullData?.description || item.description;
        const rawImage = fullData?.image || item.imageUrl || '';
        let finalImage = this.cleanImageUrl(rawImage.trim()) || '';
        const finalSource = fullData?.source || source.name;

        // REGRA DE OURO: Se não tem imagem, DELETA e PULA.
        if (!this.isValidImage(finalImage)) {
          this.logger.warn(`[PURGE] News without image deleted: ${finalTitle}`);
          await this.prisma.news.deleteMany({
            where: { 
              OR: [
                { externalUrl: item.link },
                { title: finalTitle }
              ]
            }
          });
          continue;
        }

        // PROXY: Se a imagem for de um domínio que bloqueia hotlinking (ex: Trivela), usamos nosso proxy (APÓS VALIDAÇÃO)
        const blockedDomains = ['trivela.com.br', 'media.trivela.com.br'];
        if (finalImage && blockedDomains.some(d => finalImage.includes(d))) {
          finalImage = `https://zapscore-zapscore-api.gtalg3.easypanel.host/news/proxy-image?url=${encodeURIComponent(finalImage)}`;
        }

        // CLASSIFICAÇÃO: Tenta encontrar time ou liga
        const { teamId, leagueId } = this.classifyNews(finalTitle, finalDescription);

        // REGRA DE RIGOR: Se não pertence a nenhuma liga ou time monitorado, DESCARTA.
        if (!teamId && !leagueId) {
          // Opcional: Se quiser limpar o que já existe e agora não bate mais na regra, descomente abaixo
          // await this.prisma.news.deleteMany({ where: { externalUrl: item.link } });
          continue;
        }

        await this.prisma.news.upsert({
          where: { externalUrl: item.link },
          update: { 
            title: finalTitle,
            description: finalDescription,
            imageUrl: finalImage,
            source: finalSource,
            teamId: teamId || undefined,
            leagueId: leagueId || undefined,
            author: null
          }, 
          create: {
            title: finalTitle,
            description: finalDescription,
            source: finalSource,
            imageUrl: finalImage,
            externalUrl: item.link,
            teamId: teamId,
            leagueId: leagueId,
            author: null,
            createdAt: itemDate
          }
        });
      }
    } catch (err) {
      this.logger.warn(`[SOURCE] Failed to sync from ${source.name}: ${err.message}`);
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
        // OTIMIZAÇÃO: Se já temos a notícia com imagem, não perdemos tempo com busca/scrape
        const existing = await this.prisma.news.findUnique({
          where: { externalUrl: item.link }
        });
        if (existing?.imageUrl) {
          newCount++;
          continue;
        }

        // Decodifica a URL real antes de fazer o scraping (usando busca por título como fallback)
        const realUrl = await this.resolveGoogleNewsUrl(item.link, item.title, item.source);
        
        // Tentar buscar todos os dados da notícia diretamente no site de origem (Full Scraping)
        const fullData = await this.scrapeFullNewsData(realUrl);
        
        const finalTitle = fullData?.title || item.title;
        const finalDescription = fullData?.description || item.description;
        const finalImage = fullData?.image || item.imageUrl;
        const finalSource = fullData?.source || item.source;

        // REGRA: Sem imagem válida, deletamos se existir e pulamos
        if (!this.isValidImage(finalImage)) {
          await this.prisma.news.deleteMany({ where: { externalUrl: item.link } });
          continue;
        }

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
   * Extrai a URL original diretamente do token CBMi (Base64/Protobuf)
   * Técnica de extração de string pura do binário - À prova de bloqueio de IP.
   */
  private resolveByBase64(googleUrl: string): string | null {
    // Manual Base64/Protobuf extraction logic (stable)
    try {
      const token = googleUrl.split('articles/')[1]?.split('?')[0];
      if (!token || !token.startsWith('CBM')) return null;

      // Decodifica Base64 (Google usa o padrão URL-Safe)
      const buffer = Buffer.from(token.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
      const decoded = buffer.toString('binary');
      
      // LOG DE DIAGNÓSTICO: Vamos ver o que tem dentro do binário
      console.log(`[DECODE] Binary Sample: ${decoded.substring(0, 100).replace(/[^a-zA-Z0-9:/._-]/g, '.')}`);

      // Busca agressiva por http
      const match = decoded.match(/https?:\/\/[^\s\\"\]]+/);
      
      if (match) {
        const url = match[0];
        // Limpeza de caracteres residuais do Protobuf
        const cleanUrl = url.replace(/[\x00-\x1F\x7F-\x9F].*$/, '');
        if (cleanUrl.includes('.') && !cleanUrl.includes('google.com')) {
          console.log(`[DECODE] SUCCESS: Found ${new URL(cleanUrl).hostname}`);
          return cleanUrl;
        }
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  private cleanImageUrl(url: string | null): string | null {
    if (!url) return null;
    let target = url.trim();

    // Se for Thumbor, tenta extrair o link interno
    if (target.toLowerCase().includes('/thumbor/') && target.toLowerCase().includes('http')) {
      const parts = target.split('http');
      if (parts.length > 2) {
        target = decodeURIComponent('http' + parts[parts.length - 1]);
      }
    }

    // Limpa parâmetros de resize que podem quebrar o acesso direto em alguns CDNs
    if (target.includes('?')) {
       // Mas mantém se for algo essencial como format ou token
       // Por enquanto vamos apenas garantir que a URL base seja válida
    }

    return target;
  }

  private isValidImage(url?: string | null): boolean {
    if (!url || typeof url !== 'string') return false;
    
    let targetUrl = url.trim();
    const lowerUrl = targetUrl.toLowerCase();
    
    // 1. Blacklist: Padrões de "não-imagem" ou placeholders
    const blackList = ['placeholder', 'logo-ge', 'favicon', 'icon', 'default-image', 'spacer.gif', 'loading'];
    if (blackList.some(pattern => lowerUrl.includes(pattern))) return false;

    // 2. Especial: Tratar URLs do Thumbor (Trivela e outros)
    // Se a URL contém outra URL de imagem dentro (comum em processadores), tentamos extrair a fonte original
    if (lowerUrl.includes('/thumbor/') && lowerUrl.includes('http')) {
       const parts = targetUrl.split('http');
       if (parts.length > 2) {
          // Pega a última parte que começa com http e limpa caracteres de escape
          const rawSource = 'http' + parts[parts.length - 1];
          const decodedSource = decodeURIComponent(rawSource);
          if (this.isValidImage(decodedSource)) {
             return true; 
          }
       }
    }

    // 3. Whitelist: Deve conter uma extensão de imagem válida
    const extensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp', '.svg'];
    const hasImageExtension = extensions.some(ext => lowerUrl.includes(ext));

    // 4. Caso especial: Links de imagem de CDNs que usam parâmetros
    const isCdnImage = lowerUrl.includes('/image/') || lowerUrl.includes('/img/') || lowerUrl.includes('static') || lowerUrl.includes('wp-content/uploads');

    return hasImageExtension || isCdnImage;
  }

  private async resolveBySearch(title: string, source?: string | null): Promise<string | null> {
    const cleanTitle = title.split(' - ')[0].trim();
    const query = encodeURIComponent(`${cleanTitle} ${source || ''}`);
    
    try {
      console.log(`[SEARCH] Trying Fallback Search: ${cleanTitle}`);
      const res = await firstValueFrom(this.http.get(`https://html.duckduckgo.com/html/?q=${query}`, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        timeout: 5000
      }));
      const $ = cheerio.load(res.data);
      const firstLink = $('a.result__a').first().attr('href');
      if (firstLink) {
        const url = firstLink.includes('uddg=') ? decodeURIComponent(firstLink.split('uddg=')[1].split('&')[0]) : firstLink;
        if (url.startsWith('http') && !url.includes('google.com')) return url;
      }
    } catch (e) {
      console.log(`[SEARCH] Fallback failed.`);
    }
    return null;
  }

  /**
   * Resolve a URL original. Tenta Decode Base64 (O mais rápido), senao busca por título.
   */
  private async resolveGoogleNewsUrl(googleUrl: string, title?: string, source?: string | null): Promise<string> {
    try {
      if (!googleUrl.includes('articles/')) return googleUrl;
      
      // Tentativa 1: Decode Base64/Protobuf (Instantâneo e local)
      const base64Url = this.resolveByBase64(googleUrl);
      if (base64Url) return base64Url;

      // Tentativa 2: Busca pelo título (Backup se o decode falhar)
      if (title) {
        const searchedUrl = await this.resolveBySearch(title, source);
        if (searchedUrl) return searchedUrl;
      }

      // Tentativa 3: BatchExecute (Fallback final)
      const encodedUrl = googleUrl.split('articles/')[1]?.split('?')[0];
      const response = await firstValueFrom(this.http.get(googleUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } }));
      const html = response.data;
      const $ = cheerio.load(html);
      const sig = $('[data-n-a-sg]').attr('data-n-a-sg');
      const ts = $('[data-n-a-ts]').attr('data-n-a-ts');

      if (sig && ts && encodedUrl) {
        const payload = `f.req=[[["W679rd","[[\\"${encodedUrl}\\",\\"${ts}\\",\\"${sig}\\"]]",null,"generic"]]]`;
        const batchRes = await firstValueFrom(this.http.post('https://news.google.com/_/Dotsu9PostApi/batchexecute', 
          payload,
          {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' }
          }
        ));
        const batchText = batchRes.data;
        const match = batchText.match(/https?:\/\/[^\s\\"]+/);
        if (match && !match[0].includes('google.com')) return match[0].replace(/\\/g, '');
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
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
          'Accept-Language': 'pt-BR,pt;q=0.9',
          'Referer': 'https://www.google.com/'
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
      const status = error.response?.status;
      const msg = error.message;
      console.log(`[SCRAPE] ERROR for ${url.substring(0, 40)}: Status ${status || 'UNK'} - ${msg}`);
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
      where: {
        OR: [
          { imageUrl: null },
          { imageUrl: '' },
          { imageUrl: { contains: 'thumbor' } } // NOVO: Focar nos links problemáticos
        ]
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    console.log(`[REPAIR] Found ${newsToRepair.length} items to repair (imageUrl is null or empty)`);
    if (newsToRepair.length === 0) {
      const sample = await this.prisma.news.findMany({ take: 3, orderBy: { createdAt: 'desc' } });
      console.log(`[REPAIR] DB Sample (Recent): ${JSON.stringify(sample.map(n => ({ id: n.id, img: n.imageUrl })))}`);
    }

    let repairedCount = 0;
    for (const news of newsToRepair) {
      if (news.externalUrl) {
        console.log(`[REPAIR] Processing: ${news.title.substring(0, 40)}`);
        // Resolve a URL real (usando busca por título como estratégia primária agora)
        const realUrl = await this.resolveGoogleNewsUrl(news.externalUrl, news.title, news.source);
        
        if (realUrl === news.externalUrl) {
          console.log(`[REPAIR] Could not resolve real URL for: ${news.title}`);
        } else {
          console.log(`[REPAIR] Resolved to: ${realUrl.substring(0, 60)}`);
        }

        const fullData = await this.scrapeFullNewsData(realUrl);
        
        if (fullData) {
          console.log(`[REPAIR] Result for ${realUrl.substring(0, 40)}: Title=${!!fullData.title}, Image=${!!fullData.image}`);
          if (fullData.image || fullData.title) {
            console.log(`[REPAIR] Updating database for ID: ${news.id}`);
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
          }
        } else {
          console.log(`[REPAIR] Scraper returned NULL for: ${realUrl}`);
        }
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
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
