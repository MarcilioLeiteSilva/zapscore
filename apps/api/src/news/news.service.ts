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

  async findAll(params: { leagueId?: string; teamId?: string; limit?: string; status?: string; includeDrafts?: string }) {
    const { leagueId, teamId, limit, status, includeDrafts } = params;
    const take = limit ? parseInt(limit, 10) : 100;

    let leagueFilter: any = undefined;

    if (leagueId) {
      const extId = parseInt(leagueId, 10);
      if (!isNaN(extId) && !leagueId.includes('-')) {
        // Se for ID numérico (ex: "71", "72", "622", "135")
        leagueFilter = {
          OR: [
            {
              league: {
                externalId: extId,
              },
            },
            {
              team: {
                OR: [
                  { standings: { some: { league: { externalId: extId } } } },
                  { homeFixtures: { some: { league: { externalId: extId } } } },
                  { awayFixtures: { some: { league: { externalId: extId } } } },
                ],
              },
            },
          ],
        };
      } else {
        // Se for UUID direto
        leagueFilter = {
          OR: [
            { leagueId },
            {
              team: {
                OR: [
                  { standings: { some: { leagueId } } },
                  { homeFixtures: { some: { leagueId } } },
                  { awayFixtures: { some: { leagueId } } },
                ],
              },
            },
          ],
        };
      }
    }

    const news = await this.prisma.news.findMany({
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

    // Camada Defensiva em Tempo Real do Content Scout:
    // Garante que nenhuma notícia italiana vaze no feed do Brasileirão Série A (ID 71)
    const isBrasileiraoRequest = leagueId === '71' || (news.length > 0 && news[0].league?.externalId === 71);
    if (isBrasileiraoRequest) {
      const strictItalianTokens = [
        'football italia', 'serie a tim', 'calcio', 'scudetto', 'coppa italia',
        'serie a enilive', 'juventus', 'ac milan', 'inter milan', 'internazionale',
        'as roma', 'lazio', 'atalanta', 'fiorentina', 'bologna', 'torino', 'monza',
        'sassuolo', 'genoa', 'udinese', 'lecce', 'verona', 'cagliari', 'empoli',
        'salernitana', 'frosinone', 'como 1907', 'parma calcio', 'venezia fc'
      ];
      const brazilianClubs = [
        'flamengo', 'palmeiras', 'corinthians', 'são paulo', 'sao paulo', 'grêmio',
        'gremio', 'internacional', 'botafogo', 'fluminense', 'vasco', 'cruzeiro',
        'atlético-mg', 'atletico-mg', 'bahia', 'fortaleza', 'athletico-pr', 'cuiabá',
        'cuiaba', 'vitória', 'vitoria', 'juventude', 'criciúma', 'criciuma', 'atlético-go',
        'atletico-go', 'bragantino', 'brasileirão', 'brasileirao'
      ];

      const filtered = news.filter((item) => {
        const text = `${item.title || ''} ${item.description || ''}`.toLowerCase();
        const source = (item.source || '').toLowerCase();
        const hasItalianMarker = strictItalianTokens.some(kw => text.includes(kw) || source.includes(kw));
        const hasBrazilianMarker = brazilianClubs.some(kw => text.includes(kw));

        // Se tiver marcador italiano e NENHUM clube brasileiro, bloqueia para o Brasileirão
        if (hasItalianMarker && !hasBrazilianMarker) {
          return false;
        }
        return true;
      });

      return this.filterByStatus(filtered, status, includeDrafts);
    }

    return this.filterByStatus(news, status, includeDrafts);
  }

  private filterByStatus(items: any[], status?: string, includeDrafts?: string) {
    const mapped = items.map((item) => {
      // Regra de status inicial: RASCUNHO por padrão.
      // Apenas itens marcados explicitamente como publicados têm status 'published'.
      const isPublished =
        item.author === 'PUBLISHED' ||
        (item.content || '').startsWith('[PUBLISHED]');
      const isDraft = !isPublished;
      return {
        ...item,
        isDraft,
        status: isDraft ? 'draft' : 'published',
      };
    });

    if (status === 'draft') {
      return mapped.filter((i) => i.isDraft);
    } else if (status === 'published') {
      return mapped.filter((i) => !i.isDraft);
    } else if (includeDrafts === 'true') {
      return mapped;
    } else {
      // Para chamadas gerais de apps, entrega apenas publicadas
      return mapped.filter((i) => !i.isDraft);
    }
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

  private async resolveForeignKeys(data: any) {
    const payload = { ...data };

    // Gestão de Rascunho / Publicação sem alterar schema (Status inicial = Rascunho)
    if (payload.status === 'published' || payload.isDraft === false) {
      payload.author = 'PUBLISHED';
      if (payload.content === '[DRAFT]') {
        payload.content = null;
      } else if (payload.content?.startsWith('[DRAFT] ')) {
        payload.content = payload.content.replace('[DRAFT] ', '').trim();
      }
    } else if (payload.status === 'draft' || payload.isDraft === true) {
      if (payload.author === 'PUBLISHED') {
        payload.author = null;
      }
      if (payload.content?.startsWith('[PUBLISHED] ')) {
        payload.content = payload.content.replace('[PUBLISHED] ', '').trim();
      }
    }
    delete payload.status;
    delete payload.isDraft;

    if (payload.leagueId) {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(payload.leagueId);
      if (!isUuid) {
        const numId = parseInt(payload.leagueId, 10);
        const league = await this.prisma.league.findFirst({
          where: isNaN(numId) ? { id: payload.leagueId } : { OR: [{ externalId: numId }, { id: payload.leagueId }] },
        });
        payload.leagueId = league?.id || null;
      }
    }
    if (payload.teamId) {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(payload.teamId);
      if (!isUuid) {
        const numId = parseInt(payload.teamId, 10);
        const team = await this.prisma.team.findFirst({
          where: isNaN(numId) ? { id: payload.teamId } : { OR: [{ externalId: numId }, { id: payload.teamId }] },
        });
        payload.teamId = team?.id || null;
      }
    }
    return payload;
  }

  async create(data: any) {
    try {
      const resolvedData = await this.resolveForeignKeys(data);
      return await this.prisma.news.create({ data: resolvedData });
    } catch (error) {
      this.logger.error('ERRO AO CRIAR NOTÍCIA NO BANCO:', error);
      throw error;
    }
  }

  async update(id: string, data: any) {
    try {
      const resolvedData = await this.resolveForeignKeys(data);
      return await this.prisma.news.update({
        where: { id },
        data: resolvedData,
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

  async bulkDelete(ids: string[]) {
    try {
      if (!ids || ids.length === 0) return { count: 0 };
      const res = await this.prisma.news.deleteMany({
        where: { id: { in: ids } },
      });
      return { success: true, count: res.count };
    } catch (error) {
      this.logger.error('ERRO AO DELETAR NOTÍCIAS EM LOTE:', error);
      throw error;
    }
  }

  async reclassifyNews() {
    try {
      const [serieABrasil, serieBBrasil, serieAItalia, allLeagues, allTeams] = await Promise.all([
        this.prisma.league.findUnique({ where: { externalId: 71 } }),
        this.prisma.league.findUnique({ where: { externalId: 72 } }),
        this.prisma.league.findUnique({ where: { externalId: 135 } }),
        this.prisma.league.findMany({ select: { id: true, name: true, externalId: true } }),
        this.prisma.team.findMany({ select: { id: true, name: true } }),
      ]);

      if (!serieABrasil || !serieAItalia) {
        return { message: 'Ligas não encontradas para reclassificação' };
      }

      const leaguesByExtId = new Map<number, any>();
      for (const l of allLeagues) {
        if (l.externalId) leaguesByExtId.set(l.externalId, l);
      }

      const regionalLeagueRules: Array<{ extId: number; keywords: string[] }> = [
        { extId: 622, keywords: ['campeonato pernambucano', 'pernambucano', 'turno forró', 'turno forro', 'turno frevo', 'fpf-pe', 'futebol pernambucano'] },
        { extId: 624, keywords: ['campeonato carioca', 'cariocão', 'cariocao', 'taça guanabara', 'taca guanabara', 'taça rio', 'taca rio', 'ferj'] },
        { extId: 475, keywords: ['campeonato paulista', 'paulistão', 'paulistao', 'futebol paulista'] },
        { extId: 629, keywords: ['campeonato mineiro', 'mineiro sicoob', 'troféu inconfidência', 'mineirão', 'mineirao', 'fmf'] },
        { extId: 477, keywords: ['campeonato gaúcho', 'campeonato gaucho', 'gauchão', 'gauchao', 'futebol gaúcho', 'futebol gaucho', 'fgf'] },
        { extId: 613, keywords: ['campeonato cearense', 'cearense', 'manjadinho', 'fcf'] },
        { extId: 602, keywords: ['campeonato baiano', 'baianão', 'baianao', 'fbf'] },
        { extId: 522, keywords: ['campeonato amazonense', 'amazonense', 'barezão', 'barezao', 'faf'] },
        { extId: 521, keywords: ['campeonato amapaense', 'amapaense', 'amapazão', 'amapazao', 'faf-ap'] },
        { extId: 610, keywords: ['campeonato brasiliense', 'brasiliense', 'candangão', 'candangao', 'ffdf', 'futebol brasiliense', 'candango'] },
        { extId: 611, keywords: ['campeonato capixaba', 'capixabão', 'capixabao', 'futebol capixaba', 'fes'] },
        { extId: 615, keywords: ['campeonato rondoniense', 'rondoniense', 'ffer', 'futebol rondoniense', 'rondoniense sicoob', 'rondoniense sicredi'] },
        { extId: 628, keywords: ['campeonato goiano', 'goianão', 'goianao', 'fgf', 'futebol goiano', 'goiano 1ª divisão', 'goiano 1a divisao', 'vila nova', 'atlético-go', 'atletico-go', 'goiás ec', 'goias ec', 'aparecidense', 'anápolis', 'anapolis', 'crac', 'goianésia', 'goianesia', 'goiatuba', 'jataiense', 'anapolina', 'rio verde', 'agro ec'] },
        { extId: 621, keywords: ['campeonato piauiense', 'piauiense', 'ffp', 'futebol piauiense'] },
        { extId: 606, keywords: ['campeonato paranaense', 'paranaense', 'futebol paranaense', 'fpf-pr', 'athletico-pr', 'coritiba', 'operário-pr', 'operario-pr', 'maringá', 'maringa', 'londrina', 'fc cascavel', 'cianorte', 'azuriz', 'são joseense', 'sao joseense', 'paraná clube', 'parana clube', 'foz do iguaçu', 'foz do iguacu', 'paranavaí', 'paranavai'] },
        { extId: 605, keywords: ['campeonato catarinense', 'catarinense'] },
        { extId: 612, keywords: ['copa do nordeste', 'nordestão', 'nordestao', 'lampions'] },
        { extId: 73, keywords: ['copa do brasil'] },
      ];

      // Ordena times por tamanho de nome decrescente para precisão
      const sortedTeams = [...allTeams].sort((a, b) => b.name.length - a.name.length);

      const italianKeywords = [
        'football italia', 'serie a tim', 'calcio', 'scudetto', 'coppa italia',
        'juventus', 'ac milan', 'inter milan', 'internazionale', 'as roma', 'lazio',
        'atalanta', 'fiorentina', 'bologna', 'torino', 'monza', 'sassuolo', 'genoa',
        'udinese', 'lecce', 'verona', 'cagliari', 'empoli', 'salernitana', 'frosinone',
        'como 1907', 'parma calcio', 'venezia fc', 'orsolini', 'berardi',
        'allegri', 'pioli', 'inzaghi', 'motta', 'gasperini', 'serie a enilive'
      ];

      const brazilSerieBKeywords = [
        'série b', 'serie b', 'chapecoense', 'sport recife', 'coritiba', 'goiás',
        'ceará', 'américa-mg', 'avaí', 'novorizontino', 'mirassol', 'vila nova',
        'operário', 'crb', 'ponte preta', 'brusque', 'paysandu', 'guarani',
        'amazonas', 'ituano', 'botafogo-sp'
      ];

      const brazilKeywords = [
        'brasileirão', 'brasileirao', 'campeonato brasileiro', 'futebol brasileiro',
        'flamengo', 'palmeiras', 'corinthians', 'são paulo', 'santos', 'grêmio', 'gremio',
        'internacional', 'botafogo', 'fluminense', 'vasco', 'cruzeiro', 'atlético-mg', 'atletico-mg',
        'bahia', 'fortaleza', 'athletico-pr', 'cuiabá', 'cuiaba', 'vitória', 'vitoria',
        'juventude', 'criciúma', 'criciuma', 'atlético-go', 'atletico-go', 'red bull bragantino',
        'bragantino'
      ];

      const allNews = await this.prisma.news.findMany({
        take: 500,
        orderBy: { createdAt: 'desc' },
      });

      let updatedCount = 0;

      for (const item of allNews) {
        const fullText = `${item.title || ''} ${item.description || ''}`.toLowerCase();
        const source = (item.source || '').toLowerCase();

        let targetLeagueId: string | null = null;
        let targetTeamId: string | null = null;

        // 1. Prioridade regional: se mencionar explicitamente torneio estadual/regional
        for (const rule of regionalLeagueRules) {
          if (rule.keywords.some((kw) => fullText.includes(kw))) {
            const matchedLeague = leaguesByExtId.get(rule.extId);
            if (matchedLeague) {
              targetLeagueId = matchedLeague.id;
              break;
            }
          }
        }

        // 2. Se não for regional específico, aplica a separação de Séries A/B e Itália
        if (!targetLeagueId) {
          const isBrazilianContext = brazilKeywords.some((kw) => fullText.includes(kw));
          const isSerieBContext = brazilSerieBKeywords.some((kw) => fullText.includes(kw));
          const isItalianContext = italianKeywords.some((kw) => fullText.includes(kw));

          if (isBrazilianContext && !isItalianContext) {
            targetLeagueId = isSerieBContext && serieBBrasil ? serieBBrasil.id : serieABrasil.id;
          } else if (isItalianContext && !isBrazilianContext) {
            targetLeagueId = serieAItalia.id;
          } else if (isBrazilianContext && isItalianContext) {
            if (source.includes('gazeta') || source.includes('globo') || source.includes('lance') || source.includes('uol')) {
              targetLeagueId = serieABrasil.id;
            } else {
              targetLeagueId = serieAItalia.id;
            }
          }
        }

        // 3. Se a notícia não tiver time associado, tenta associar time mencionado
        if (!item.teamId) {
          for (const team of sortedTeams) {
            const teamName = team.name.toLowerCase();
            if (teamName.length > 4) {
              if (fullText.includes(teamName)) {
                targetTeamId = team.id;
                break;
              }
            } else {
              const regex = new RegExp(`\\b${teamName}\\b`, 'i');
              if (regex.test(fullText)) {
                targetTeamId = team.id;
                break;
              }
            }
          }
        }

        const updateData: any = {};
        if (targetLeagueId && targetLeagueId !== item.leagueId) {
          updateData.leagueId = targetLeagueId;
        }
        if (targetTeamId && targetTeamId !== item.teamId) {
          updateData.teamId = targetTeamId;
        }

        if (Object.keys(updateData).length > 0) {
          await this.prisma.news.update({
            where: { id: item.id },
            data: updateData,
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
