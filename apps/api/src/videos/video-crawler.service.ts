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
      // 0. Limpeza: Remover vídeos que não sejam da temporada 2026
      await this.purgeNon2026Videos();
      
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
    this.logger.debug(`Crawling YouTube for query: ${query}`);
    try {
      // Busca direta no YouTube ordenada por data (sp=CAI%3D)
      const searchQuery = `${query} gols melhores momentos`;
      const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(searchQuery)}&sp=CAI%253D`;
      
      const response = await firstValueFrom(
        this.http.get(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
          },
        })
      );

      const items = this.parseYouTubeHtml(response.data);
      this.logger.debug(`Found ${items.length} videos on YouTube for ${query}`);
      
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
              createdAt: new Date(), // YouTube scraping leve não dá data exata facilmente
              ...ids
            }
          });
          savedCount++;
        } catch (e) { }
      }

      if (savedCount > 0) {
        this.logger.log(`Saved ${savedCount} videos for ${query}`);
        
        // Limpeza: Manter apenas os 100 mais recentes por liga para evitar inchaço no banco
        if (ids.leagueId) {
          const videoCount = await this.prisma.video.count({
            where: { leagueId: ids.leagueId }
          });

          if (videoCount > 100) {
            const videosToDelete = await this.prisma.video.findMany({
              where: { leagueId: ids.leagueId },
              orderBy: { createdAt: 'asc' },
              take: videoCount - 100,
            });

            if (videosToDelete.length > 0) {
              await this.prisma.video.deleteMany({
                where: { id: { in: videosToDelete.map(v => v.id) } }
              });
              this.logger.debug(`Cleaned up ${videosToDelete.length} old videos for league ${ids.leagueId}`);
            }
          }
        }
      }
    } catch (err) {
      this.logger.error(`Error crawling YouTube for ${query}: ${err.message}`);
    }
  }

  private parseYouTubeHtml(html: string) {
    const items = [];
    try {
      // Extrai o JSON de dados iniciais do YouTube
      const jsonMatch = /var ytInitialData = ({[\s\S]*?});<\/script>/.exec(html);
      if (!jsonMatch) return [];

      const data = JSON.parse(jsonMatch[1]);
      const contents = data.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents;
      if (!contents) return [];

      const videoList = contents.find((c: any) => c.itemSectionRenderer)?.itemSectionRenderer?.contents || [];

      for (const item of videoList) {
        const video = item.videoRenderer;
        if (!video || !video.videoId) continue;

        const title = video.title?.runs?.[0]?.text || '';
        const videoId = video.videoId;
        const description = video.detailedMetadataSnippets?.[0]?.snippetText?.runs?.map((r: any) => r.text).join('') || '';

        items.push({
          title: title,
          link: `https://www.youtube.com/watch?v=${videoId}`,
          description: description,
          thumbnailUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
        });

        if (items.length >= 10) break;
      }
    } catch (e) {
      this.logger.error(`Error parsing YouTube JSON: ${e.message}`);
    }
    return items;
  }

  private async purgeNon2026Videos() {
    try {
      const result = await this.prisma.video.deleteMany({
        where: {
          NOT: {
            title: {
              contains: '2026',
              mode: 'insensitive',
            },
          },
        },
      });
      if (result.count > 0) {
        this.logger.log(`Purged ${result.count} old/non-2026 videos from database.`);
      }
    } catch (error) {
      this.logger.error(`Error purging old videos: ${error.message}`);
    }
  }
}
