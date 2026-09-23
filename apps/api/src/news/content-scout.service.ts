import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

export interface AuditResult {
  summary: {
    totalNews: number;
    totalAudited: number;
    contaminatedCount: number;
    healthyCount: number;
    complianceRate: number; // Porcentagem de conformidade (0-100)
    lastAuditTimestamp: string;
  };
  leagues: Array<{
    id: string;
    externalId: number;
    name: string;
    country: string | null;
    totalNews: number;
    contaminatedNews: number;
    healthStatus: 'HEALTHY' | 'WARNING' | 'CRITICAL';
  }>;
  flaggedItems: Array<{
    id: string;
    title: string;
    source: string | null;
    currentLeagueId: string | null;
    currentLeagueName: string;
    suggestedLeagueExternalId: number | null;
    suggestedLeagueName: string;
    violationType: 'ITALIAN_IN_BRAZIL' | 'BRAZIL_IN_ITALY' | 'SERIE_B_IN_SERIE_A' | 'GENERIC_MISMATCH';
    severity: 'HIGH' | 'MEDIUM';
    detectedTokens: string[];
    createdAt: Date;
  }>;
}

@Injectable()
export class ContentScoutService {
  private readonly logger = new Logger(ContentScoutService.name);

  // Dicionários semânticos oficiais
  private readonly ITALIAN_KEYWORDS = [
    'football italia', 'football-italia', 'serie a tim', 'calcio', 'scudetto', 'coppa italia',
    'serie a enilive', 'juventus', 'ac milan', 'inter milan', 'internazionale', 'as roma',
    'lazio', 'atalanta', 'fiorentina', 'bologna', 'torino', 'monza', 'sassuolo', 'genoa',
    'udinese', 'lecce', 'verona', 'hellas verona', 'cagliari', 'empoli', 'salernitana',
    'frosinone', 'como 1907', 'parma calcio', 'venezia fc', 'cremonese', 'spezia',
    'sampdoria', 'san siro', 'allianz stadium', 'stadio olimpico', 'allegri', 'pioli',
    'inzaghi', 'thiago motta', 'gasperini', 'antonio conte', 'de rossi', 'vlahovic',
    'lautaro martinez', 'marcus thuram', 'rafael leao', 'kvaratskhelia', 'chiesa',
    'bellingham', 'gazzetta dello sport', 'corriere dello sport', 'tuttosport'
  ];

  private readonly BRAZIL_SERIE_A_KEYWORDS = [
    'brasileirão', 'brasileirao', 'campeonato brasileiro', 'série a betano', 'serie a betano',
    'flamengo', 'palmeiras', 'corinthians', 'são paulo fc', 'sao paulo fc', 'grêmio', 'gremio',
    'internacional', 'botafogo', 'fluminense', 'vasco', 'vasco da gama', 'cruzeiro',
    'atlético-mg', 'atletico-mg', 'bahia', 'fortaleza', 'athletico-pr', 'athletico paranaense',
    'cuiabá', 'cuiaba', 'vitória', 'vitoria', 'juventude', 'criciúma', 'criciuma',
    'atlético-go', 'atletico-go', 'red bull bragantino', 'bragantino', 'maracanã', 'maracana',
    'neo química arena', 'allianz parque', 'morumbis', 'arena mrv', 'beira-rio'
  ];

  private readonly BRAZIL_SERIE_B_KEYWORDS = [
    'série b', 'serie b', 'brasileirão série b', 'santos fc', 'sport recife', 'coritiba',
    'goiás', 'goias', 'ceará', 'ceara', 'américa-mg', 'america-mg', 'avaí', 'avai',
    'novorizontino', 'mirassol', 'vila nova', 'operário-pr', 'operario', 'crb', 'ponte preta',
    'brusque', 'paysandu', 'guarani', 'amazonas fc', 'ituano', 'botafogo-sp', 'chapecoense'
  ];

  private readonly PREMIER_LEAGUE_KEYWORDS = [
    'premier league', 'arsenal', 'chelsea', 'liverpool', 'manchester city', 'man city',
    'manchester united', 'man united', 'tottenham', 'newcastle', 'aston villa', 'west ham'
  ];

  private readonly LA_LIGA_KEYWORDS = [
    'la liga', 'laliga', 'real madrid', 'barcelona', 'barça', 'atletico madrid', 'atlético de madrid',
    'sevilla', 'valencia', 'villarreal', 'athletic bilbao', 'real sociedad'
  ];

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Cron autônomo executado a cada 30 minutos em segundo plano
   * Higieniza e reclassifica contaminações no banco de dados.
   */
  @Cron('*/30 * * * *')
  async handlePeriodicScoutAudit() {
    this.logger.log('[CONTENT-SCOUT] Iniciando auditoria e higienização automática periódica (30m)...');
    try {
      const result = await this.heal();
      this.logger.log(`[CONTENT-SCOUT] Auto-Heal finalizado: ${result.fixedCount} matérias corrigidas.`);
    } catch (err: any) {
      this.logger.error(`[CONTENT-SCOUT] Erro na higienização periódica: ${err.message}`);
    }
  }

  /**
   * Audita as notícias do banco de dados e retorna telemetria analítica detalhada
   */
  async audit(): Promise<AuditResult> {
    const totalNews = await this.prisma.news.count();
    const leagues = await this.prisma.league.findMany({
      orderBy: { name: 'asc' },
    });

    const recentNews = await this.prisma.news.findMany({
      take: 1000,
      orderBy: { createdAt: 'desc' },
      include: {
        league: true,
      },
    });

    const flaggedItems: AuditResult['flaggedItems'] = [];
    let contaminatedCount = 0;

    // Cache rápido de ligas
    const leagueByExtId = new Map<number, { id: string; name: string }>();
    for (const l of leagues) {
      leagueByExtId.set(l.externalId, { id: l.id, name: l.name });
    }

    for (const item of recentNews) {
      const text = `${item.title || ''} ${item.description || ''} ${item.content || ''}`.toLowerCase();
      const source = (item.source || '').toLowerCase();
      const fullSemanticText = `${text} ${source}`;

      const currentExtId = item.league?.externalId;
      const currentLeagueName = item.league?.name || 'Sem Liga Atribuída';

      // 1. Checagem: Notícia Italiana com ID da Liga do Brasil Série A (71)
      if (currentExtId === 71) {
        const detectedItalian = this.ITALIAN_KEYWORDS.filter(kw => fullSemanticText.includes(kw));
        const detectedBraA = this.BRAZIL_SERIE_A_KEYWORDS.filter(kw => fullSemanticText.includes(kw));
        const isFromItalianSource = source.includes('football italia') || source.includes('football-italia');

        // Se tem marcadores italianos claros e nenhum clube brasileiro, OU veio de fonte 100% italiana
        if ((detectedItalian.length > 0 && detectedBraA.length === 0) || (isFromItalianSource && detectedBraA.length === 0)) {
          contaminatedCount++;
          flaggedItems.push({
            id: item.id,
            title: item.title,
            source: item.source,
            currentLeagueId: item.leagueId,
            currentLeagueName,
            suggestedLeagueExternalId: 135,
            suggestedLeagueName: leagueByExtId.get(135)?.name || 'Serie A (Itália)',
            violationType: 'ITALIAN_IN_BRAZIL',
            severity: 'HIGH',
            detectedTokens: detectedItalian.slice(0, 5),
            createdAt: item.createdAt,
          });
          continue;
        }

        // Checagem se é estritamente da Série B
        const detectedBraB = this.BRAZIL_SERIE_B_KEYWORDS.filter(kw => fullSemanticText.includes(kw));
        if (detectedBraB.length > 0 && detectedBraA.length === 0 && !detectedItalian.length) {
          contaminatedCount++;
          flaggedItems.push({
            id: item.id,
            title: item.title,
            source: item.source,
            currentLeagueId: item.leagueId,
            currentLeagueName,
            suggestedLeagueExternalId: 72,
            suggestedLeagueName: leagueByExtId.get(72)?.name || 'Série B (Brasil)',
            violationType: 'SERIE_B_IN_SERIE_A',
            severity: 'MEDIUM',
            detectedTokens: detectedBraB.slice(0, 5),
            createdAt: item.createdAt,
          });
          continue;
        }
      }

      // 2. Checagem: Notícia Brasileira com ID da Liga Italiana (135)
      if (currentExtId === 135) {
        const detectedBraA = this.BRAZIL_SERIE_A_KEYWORDS.filter(kw => fullSemanticText.includes(kw));
        const detectedItalian = this.ITALIAN_KEYWORDS.filter(kw => fullSemanticText.includes(kw));

        if (detectedBraA.length > 0 && detectedItalian.length === 0) {
          contaminatedCount++;
          flaggedItems.push({
            id: item.id,
            title: item.title,
            source: item.source,
            currentLeagueId: item.leagueId,
            currentLeagueName,
            suggestedLeagueExternalId: 71,
            suggestedLeagueName: leagueByExtId.get(71)?.name || 'Brasileirão Série A',
            violationType: 'BRAZIL_IN_ITALY',
            severity: 'HIGH',
            detectedTokens: detectedBraA.slice(0, 5),
            createdAt: item.createdAt,
          });
          continue;
        }
      }
    }

    // Monta o resumo por liga
    const leaguesOverview = await Promise.all(
      leagues.map(async (l) => {
        const total = await this.prisma.news.count({ where: { leagueId: l.id } });
        const contaminatedInThisLeague = flaggedItems.filter(f => f.currentLeagueId === l.id).length;
        
        let healthStatus: 'HEALTHY' | 'WARNING' | 'CRITICAL' = 'HEALTHY';
        if (contaminatedInThisLeague > 10) healthStatus = 'CRITICAL';
        else if (contaminatedInThisLeague > 0) healthStatus = 'WARNING';

        return {
          id: l.id,
          externalId: l.externalId,
          name: l.name,
          country: l.country,
          totalNews: total,
          contaminatedNews: contaminatedInThisLeague,
          healthStatus,
        };
      })
    );

    const totalAudited = recentNews.length;
    const healthyCount = totalAudited - contaminatedCount;
    const complianceRate = totalAudited > 0 ? Number(((healthyCount / totalAudited) * 100).toFixed(1)) : 100;

    return {
      summary: {
        totalNews,
        totalAudited,
        contaminatedCount,
        healthyCount,
        complianceRate,
        lastAuditTimestamp: new Date().toISOString(),
      },
      leagues: leaguesOverview.filter(l => l.totalNews > 0 || l.contaminatedNews > 0 || [71, 72, 135, 39, 140].includes(l.externalId)),
      flaggedItems: flaggedItems.slice(0, 100), // Exibe até 100 itens com alerta
    };
  }

  /**
   * Executa a faxina e reclassificação em lote (Auto-Healer)
   * Move matérias contaminadas para suas ligas de direito de forma idempotente.
   */
  async heal() {
    this.logger.log('[CONTENT-SCOUT] Executando rotina de faxina e reclassificação de conteúdo...');

    const [serieABrasil, serieBBrasil, serieAItalia, premierLeague, laLiga] = await Promise.all([
      this.prisma.league.findUnique({ where: { externalId: 71 } }),
      this.prisma.league.findUnique({ where: { externalId: 72 } }),
      this.prisma.league.findUnique({ where: { externalId: 135 } }),
      this.prisma.league.findUnique({ where: { externalId: 39 } }),
      this.prisma.league.findUnique({ where: { externalId: 140 } }),
    ]);

    // Busca todas as notícias (varredura profunda)
    const allNews = await this.prisma.news.findMany({
      take: 2000,
      orderBy: { createdAt: 'desc' },
      include: { league: true },
    });

    let fixedCount = 0;
    const fixedItems: Array<{ id: string; title: string; fromLeague: string; toLeague: string }> = [];

    for (const item of allNews) {
      const text = `${item.title || ''} ${item.description || ''} ${item.content || ''}`.toLowerCase();
      const source = (item.source || '').toLowerCase();
      const fullSemanticText = `${text} ${source}`;

      const currentExtId = item.league?.externalId;
      let targetLeagueId: string | null = null;
      let targetLeagueName = '';

      const detectedItalian = this.ITALIAN_KEYWORDS.filter(kw => fullSemanticText.includes(kw));
      const detectedBraA = this.BRAZIL_SERIE_A_KEYWORDS.filter(kw => fullSemanticText.includes(kw));
      const detectedBraB = this.BRAZIL_SERIE_B_KEYWORDS.filter(kw => fullSemanticText.includes(kw));
      const isFromItalianSource = source.includes('football italia') || source.includes('football-italia');

      // CASO 1: Matéria na Série A Brasil (71), mas é sobre o Calcio Italiano
      if (currentExtId === 71) {
        if ((detectedItalian.length > 0 && detectedBraA.length === 0) || (isFromItalianSource && detectedBraA.length === 0)) {
          if (serieAItalia) {
            targetLeagueId = serieAItalia.id;
            targetLeagueName = 'Serie A (Itália)';
          }
        } else if (detectedBraB.length > 0 && detectedBraA.length === 0 && detectedItalian.length === 0) {
          if (serieBBrasil) {
            targetLeagueId = serieBBrasil.id;
            targetLeagueName = 'Série B (Brasil)';
          }
        }
      }

      // CASO 2: Matéria na Série A Itália (135), mas é sobre clubes brasileiros
      if (currentExtId === 135) {
        if (detectedBraA.length > 0 && detectedItalian.length === 0) {
          if (serieABrasil) {
            targetLeagueId = serieABrasil.id;
            targetLeagueName = 'Brasileirão Série A';
          }
        } else if (detectedBraB.length > 0 && detectedBraA.length === 0 && detectedItalian.length === 0) {
          if (serieBBrasil) {
            targetLeagueId = serieBBrasil.id;
            targetLeagueName = 'Série B (Brasil)';
          }
        }
      }

      // Aplica a transferência cirúrgica se identificada
      if (targetLeagueId && targetLeagueId !== item.leagueId) {
        await this.prisma.news.update({
          where: { id: item.id },
          data: { leagueId: targetLeagueId },
        });

        fixedCount++;
        fixedItems.push({
          id: item.id,
          title: item.title,
          fromLeague: item.league?.name || 'Desconhecida',
          toLeague: targetLeagueName,
        });
      }
    }

    this.logger.log(`[CONTENT-SCOUT] Faxina concluída com sucesso: ${fixedCount} notícias reclassificadas.`);
    return {
      success: true,
      fixedCount,
      fixedItems: fixedItems.slice(0, 50),
    };
  }

  /**
   * Permite ao administrador reclassificar manualmente a liga de uma notícia pontual
   */
  async reassignLeague(newsId: string, targetLeagueId: string | null) {
    const updated = await this.prisma.news.update({
      where: { id: newsId },
      data: { leagueId: targetLeagueId },
      include: { league: true },
    });
    this.logger.log(`[CONTENT-SCOUT] Notícia "${updated.title}" reatribuída para ${updated.league?.name || 'Sem Liga'}`);
    return updated;
  }

  /**
   * Remove uma notícia identificada como spam ou não pertinente
   */
  async removeNews(newsId: string) {
    await this.prisma.news.delete({
      where: { id: newsId },
    });
    this.logger.log(`[CONTENT-SCOUT] Notícia ${newsId} removida com sucesso.`);
    return { success: true, id: newsId };
  }

  /**
   * Retorna todas as ligas para o seletor do AdminPanel
   */
  async getLeagues() {
    return this.prisma.league.findMany({
      orderBy: { name: 'asc' },
      select: {
        id: true,
        externalId: true,
        name: true,
        country: true,
        logo: true,
      },
    });
  }
}
