import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NewsService implements OnModuleInit {
  private readonly logger = new Logger(NewsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    // Executa reclassificação silenciosa na inicialização do servidor
    this.reclassifyNews().catch((err) => {
      this.logger.error(`Erro ao reclassificar notícias no boot: ${err.message}`);
    });
  }

  async findAll(params: { leagueId?: string; teamId?: string; limit?: string }) {
    const { leagueId, teamId, limit } = params;
    const take = limit ? parseInt(limit, 10) : 100;

    let leagueFilter: any = undefined;

    if (leagueId) {
      const extId = parseInt(leagueId, 10);
      if (!isNaN(extId) && !leagueId.includes('-')) {
        // Se for ID numérico (ex: "71", "72", "135"), filtra pela relação com League.externalId
        leagueFilter = {
          league: {
            externalId: extId,
          },
        };
      } else {
        // Se for UUID direto
        leagueFilter = { leagueId };
      }
    }

    return this.prisma.news.findMany({
      where: {
        ...(leagueFilter ? leagueFilter : {}),
        ...(teamId && { teamId }),
      },
      orderBy: { createdAt: 'desc' },
      take: take,
      include: {
        league: true,
        team: true,
      },
    });
  }

  async findOne(id: string) {
    return this.prisma.news.findUnique({
      where: { id },
      include: {
        league: true,
        team: true,
      },
    });
  }

  async create(data: any) {
    try {
      return await this.prisma.news.create({ data });
    } catch (error) {
      this.logger.error('ERRO AO CRIAR NOTÍCIA NO BANCO:', error);
      throw error;
    }
  }

  async update(id: string, data: any) {
    try {
      return await this.prisma.news.update({
        where: { id },
        data,
      });
    } catch (error) {
      this.logger.error('ERRO AO ATUALIZAR NOTÍCIA:', error);
      throw error;
    }
  }

  async remove(id: string) {
    try {
      return await this.prisma.news.delete({
        where: { id },
      });
    } catch (error) {
      this.logger.error('ERRO AO DELETAR NOTÍCIA:', error);
      throw error;
    }
  }

  async reclassifyNews() {
    try {
      const [serieABrasil, serieBBrasil, serieAItalia] = await Promise.all([
        this.prisma.league.findUnique({ where: { externalId: 71 } }),
        this.prisma.league.findUnique({ where: { externalId: 72 } }),
        this.prisma.league.findUnique({ where: { externalId: 135 } }),
      ]);

      if (!serieABrasil || !serieAItalia) {
        return { message: 'Ligas não encontradas para reclassificação' };
      }

      const italianKeywords = [
        'football italia', 'serie a tim', 'calcio', 'scudetto', 'coppa italia',
        'juventus', 'ac milan', 'milan', 'inter milan', 'internazionale', 'napoli', 'as roma', 'lazio',
        'atalanta', 'fiorentina', 'bologna', 'torino', 'monza', 'sassuolo', 'genoa',
        'udinese', 'lecce', 'verona', 'cagliari', 'empoli', 'salernitana', 'frosinone',
        'como', 'parma', 'venezia', 'leao', 'tedesco', 'orsolini', 'berardi', 'kessié',
        'allegri', 'pioli', 'inzaghi', 'motta', 'conte', 'gasperini', 'serie a |', 'serie a:'
      ];

      const brazilSerieBKeywords = [
        'série b', 'serie b', 'chapecoense', 'sport recife', 'coritiba', 'goiás',
        'ceará', 'américa-mg', 'avaí', 'novorizontino', 'mirassol', 'vila nova',
        'operário', 'crb', 'ponte preta', 'brusque', 'paysandu', 'guarani',
        'amazonas', 'ituano', 'botafogo-sp'
      ];

      const brazilKeywords = [
        'brasileirão', 'brasileirao', 'campeonato brasileiro', 'flamengo', 'palmeiras',
        'corinthians', 'são paulo', 'santos', 'grêmio', 'gremio', 'internacional',
        'botafogo', 'fluminense', 'vasco', 'cruzeiro', 'atlético-mg', 'atletico-mg',
        'bahia', 'fortaleza', 'athletico-pr', 'cuiabá', 'cuiaba', 'vitória', 'vitoria',
        'juventude', 'criciúma', 'criciuma', 'atlético-go', 'atletico-go',
        'jovem pan', 'gazeta esportiva', 'torcedores', 'globo esporte', 'ge.globo',
        'uol', 'lance!'
      ];

      const allNews = await this.prisma.news.findMany({
        take: 500,
        orderBy: { createdAt: 'desc' },
      });

      let updatedCount = 0;

      for (const item of allNews) {
        const fullText = `${item.title || ''} ${item.description || ''}`.toLowerCase();
        const source = (item.source || '').toLowerCase();
        const combined = `${fullText} ${source}`;

        let targetLeagueId: string | null = null;

        if (italianKeywords.some((kw) => combined.includes(kw))) {
          targetLeagueId = serieAItalia.id;
        } else if (serieBBrasil && brazilSerieBKeywords.some((kw) => combined.includes(kw))) {
          targetLeagueId = serieBBrasil.id;
        } else if (brazilKeywords.some((kw) => combined.includes(kw))) {
          targetLeagueId = serieABrasil.id;
        }

        if (targetLeagueId && targetLeagueId !== item.leagueId) {
          await this.prisma.news.update({
            where: { id: item.id },
            data: { leagueId: targetLeagueId },
          });
          updatedCount++;
        }
      }

      this.logger.log(`[RECLASSIFY] Reclassificação concluída: ${updatedCount} notícias ajustadas com precisão.`);
      return { success: true, updatedCount };
    } catch (err: any) {
      this.logger.error(`[RECLASSIFY] Falha na reclassificação: ${err.message}`);
      return { success: false, error: err.message };
    }
  }
}
