import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

export interface AuditResult {
  summary: {
    totalNews: number;
    totalAudited: number;
    contaminatedCount: number;
    nonCompliantCount: number;
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
    violationType: 'ITALIAN_IN_BRAZIL' | 'BRAZIL_IN_ITALY' | 'SERIE_B_IN_SERIE_A' | 'CROSS_LEAGUE_MISMATCH' | 'NON_COMPLIANT_IRRELEVANT' | 'GENERIC_MISMATCH';
    severity: 'HIGH' | 'MEDIUM';
    detectedTokens: string[];
    createdAt: Date;
  }>;
}

export interface SanitizeResult {
  success: boolean;
  totalAudited: number;
  healthyCount: number;
  reclassifiedCount: number;
  purgedCount: number;
  nonCompliantCount: number;
  reclassifiedItems: Array<{
    id: string;
    title: string;
    fromLeague: string;
    toLeague: string;
  }>;
  purgedItems: Array<{
    id: string;
    title: string;
    league: string;
    reason: string;
  }>;
  timestamp: string;
}

@Injectable()
export class ContentScoutService {
  private readonly logger = new Logger(ContentScoutService.name);

  // Dicionários semânticos e canônicos por competição (externalId)
  private readonly LEAGUE_RULES: Record<number, { name: string; country: string; keywords: string[] }> = {
    135: {
      name: 'Serie A (Itália)',
      country: 'Itália',
      keywords: [
        'football italia', 'football-italia', 'serie a tim', 'calcio', 'scudetto', 'coppa italia',
        'serie a enilive', 'juventus', 'ac milan', 'inter milan', 'internazionale', 'as roma',
        'lazio', 'atalanta', 'fiorentina', 'bologna', 'torino', 'monza', 'sassuolo', 'genoa',
        'udinese', 'lecce', 'verona', 'hellas verona', 'cagliari', 'empoli', 'salernitana',
        'frosinone', 'como 1907', 'parma calcio', 'venezia fc', 'cremonese', 'spezia',
        'sampdoria', 'san siro', 'allianz stadium', 'stadio olimpico', 'allegri', 'pioli',
        'inzaghi', 'thiago motta', 'gasperini', 'antonio conte', 'de rossi', 'vlahovic',
        'lautaro martinez', 'marcus thuram', 'rafael leao', 'kvaratskhelia', 'chiesa',
        'gazzetta dello sport', 'corriere dello sport', 'tuttosport'
      ]
    },
    71: {
      name: 'Brasileirão Série A',
      country: 'Brasil',
      keywords: [
        'brasileirão', 'brasileirao', 'campeonato brasileiro', 'série a betano', 'serie a betano',
        'flamengo', 'palmeiras', 'corinthians', 'são paulo fc', 'sao paulo fc', 'grêmio', 'gremio',
        'internacional', 'botafogo', 'fluminense', 'vasco', 'vasco da gama', 'cruzeiro',
        'atlético-mg', 'atletico-mg', 'bahia', 'fortaleza', 'athletico-pr', 'athletico paranaense',
        'cuiabá', 'cuiaba', 'vitória', 'vitoria', 'juventude', 'criciúma', 'criciuma',
        'atlético-go', 'atletico-go', 'red bull bragantino', 'bragantino', 'maracanã', 'maracana',
        'neo química arena', 'allianz parque', 'morumbis', 'arena mrv', 'beira-rio'
      ]
    },
    72: {
      name: 'Brasileirão Série B',
      country: 'Brasil',
      keywords: [
        'série b', 'serie b', 'brasileirão série b', 'santos fc', 'sport recife', 'coritiba',
        'goiás', 'goias', 'ceará', 'ceara', 'américa-mg', 'america-mg', 'avaí', 'avai',
        'novorizontino', 'mirassol', 'vila nova', 'operário-pr', 'operario', 'crb', 'ponte preta',
        'brusque', 'paysandu', 'guarani', 'amazonas fc', 'ituano', 'botafogo-sp', 'chapecoense'
      ]
    },
    39: {
      name: 'Premier League',
      country: 'Inglaterra',
      keywords: [
        'premier league', 'arsenal', 'chelsea', 'liverpool', 'manchester city', 'man city',
        'manchester united', 'man united', 'tottenham', 'spurs', 'newcastle', 'aston villa',
        'west ham', 'everton', 'brighton', 'wolves', 'crystal palace', 'brentford', 'fulham',
        'bournemouth', 'nottingham forest', 'leicester'
      ]
    },
    140: {
      name: 'La Liga',
      country: 'Espanha',
      keywords: [
        'la liga', 'laliga', 'real madrid', 'barcelona', 'barça', 'atletico madrid', 'atlético de madrid',
        'sevilla', 'valencia', 'villarreal', 'athletic bilbao', 'real sociedad', 'real betis',
        'celta de vigo', 'mallorca', 'osasuna', 'getafe', 'rayo vallecano', 'girona'
      ]
    },
    78: {
      name: 'Bundesliga',
      country: 'Alemanha',
      keywords: [
        'bundesliga', 'bayern munich', 'bayern münchen', 'borussia dortmund', 'bayer leverkusen',
        'rb leipzig', 'eintracht frankfurt', 'stuttgart', 'wolfsburg', 'borussia mönchengladbach'
      ]
    },
    61: {
      name: 'Ligue 1',
      country: 'França',
      keywords: [
        'ligue 1', 'paris saint-germain', 'psg', 'olympique de marseille', 'marseille', 'monaco',
        'lyon', 'olympique lyonnais', 'lille', 'rennes', 'nice', 'lens'
      ]
    },
    2: {
      name: 'UEFA Champions League',
      country: 'Europa',
      keywords: ['champions league', 'uefa champions', 'ucl']
    },
    73: {
      name: 'Copa do Brasil',
      country: 'Brasil',
      keywords: ['copa do brasil', 'copa betano do brasil']
    },
    612: {
      name: 'Copa do Nordeste',
      country: 'Brasil',
      keywords: ['copa do nordeste', 'nordestão', 'nordestao', 'lampions league']
    },
    622: {
      name: 'Campeonato Pernambucano',
      country: 'Brasil',
      keywords: [
        'campeonato pernambucano', 'pernambucano', 'sport recife', 'náutico', 'nautico', 'santa cruz',
        'retrô', 'retro fc', 'central de caruaru', 'maguary', 'petrolina', 'afogados', 'jaguar',
        'decisão', 'decisao', 'porto-pe', 'salgueiro', 'ilha do retiro', 'aflitos', 'arruda', 'arena de pernambuco'
      ]
    },
    624: {
      name: 'Campeonato Carioca',
      country: 'Brasil',
      keywords: [
        'campeonato carioca', 'cariocão', 'cariocao', 'taça guanabara', 'taca guanabara', 'taça rio',
        'flamengo', 'fluminense', 'vasco da gama', 'botafogo', 'volta redonda', 'nova iguaçu',
        'madureira', 'bangu', 'boavista-rj', 'sampaio corrêa-rj', 'portuguesa-rj', 'maricá', 'audax-rj'
      ]
    },
    475: {
      name: 'Campeonato Paulista',
      country: 'Brasil',
      keywords: [
        'campeonato paulista', 'paulistão', 'paulistao', 'palmeiras', 'são paulo', 'corinthians',
        'santos fc', 'red bull bragantino', 'ponte preta', 'guarani', 'mirassol', 'novorizontino',
        'ituano', 'botafogo-sp', 'são bernardo', 'inter de limeira', 'água santa', 'santo andré',
        'portuguesa', 'noroeste', 'velo clube'
      ]
    },
    629: {
      name: 'Campeonato Mineiro',
      country: 'Brasil',
      keywords: [
        'campeonato mineiro', 'mineirão', 'mineirao', 'atlético-mg', 'cruzeiro', 'américa-mg',
        'tombense', 'athletic club', 'villa nova-mg', 'pouso alegre', 'ipatinga', 'democrata-gv', 'uberlândia'
      ]
    },
    477: {
      name: 'Campeonato Gaúcho',
      country: 'Brasil',
      keywords: [
        'campeonato gaúcho', 'gauchão', 'gauchao', 'grêmio', 'internacional', 'juventude',
        'caxias', 'brasil de pelotas', 'ypiranga', 'são josé-rs', 'novo hamburgo', 'avenida',
        'santa cruz-rs', 'são luiz', 'guarany de bagé'
      ]
    },
    609: {
      name: 'Campeonato Cearense',
      country: 'Brasil',
      keywords: [
        'campeonato cearense', 'cearense', 'fortaleza ec', 'ceará sc', 'ceara sc', 'ferroviário',
        'floresta', 'atlético cearense', 'iguatu'
      ]
    },
    602: {
      name: 'Campeonato Baiano',
      country: 'Brasil',
      keywords: [
        'campeonato baiano', 'baianão', 'baianao', 'bahia', 'vitória', 'jacuipense', 'juazeirense',
        'bahia de feira', 'barcelona de ilhéus', 'jequié', 'itabuna'
      ]
    },
    606: {
      name: 'Campeonato Paranaense',
      country: 'Brasil',
      keywords: [
        'campeonato paranaense', 'paranaense', 'athletico-pr', 'coritiba', 'operário-pr',
        'maringá', 'londrina', 'fc cascavel', 'cianorte', 'azuriz'
      ]
    },
    604: {
      name: 'Campeonato Catarinense',
      country: 'Brasil',
      keywords: [
        'campeonato catarinense', 'catarinense', 'chapecoense', 'avaí', 'figueirense',
        'criciúma', 'brusque', 'joinville', 'marcílio dias', 'hercílio luz'
      ]
    },
    628: {
      name: 'Campeonato Goiano',
      country: 'Brasil',
      keywords: [
        'campeonato goiano', 'goianão', 'goianao', 'goiás ec', 'atlético-go', 'vila nova',
        'aparecidense', 'anápolis', 'goianésia'
      ]
    }
  };

  private readonly SPAM_OR_OFFTOPIC_KEYWORDS = [
    'horóscopo', 'signo', 'previsão do tempo', 'lotofácil', 'mega-sena', 'receita de bolo',
    'bbb24', 'bbb25', 'bbb26', 'reality show', 'fofoca', 'novela das', 'nba', 'basquete',
    'formula 1', 'fórmula 1', 'ufc', 'mma', 'boxe', 'esports', 'free fire', 'counter-strike',
    'cs2', 'valorant', 'league of legends'
  ];

  private readonly FOOTBALL_CORE_TERMS = [
    'futebol', 'jogo', 'partida', 'gol', 'gols', 'técnico', 'treinador', 'clube', 'campeonato',
    'rodada', 'escalação', 'estádio', 'torcida', 'vitória', 'derrota', 'empate', 'tabela',
    'classificação', 'elenco', 'jogador', 'atleta', 'reforço', 'contratação', 'bola'
  ];

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Cron autônomo executado a cada 30 minutos em segundo plano
   * Higieniza, reclassifica contaminações e purga notícias não conformes.
   */
  @Cron('*/30 * * * *')
  async handlePeriodicScoutAudit() {
    this.logger.log('[CONTENT-SCOUT] Iniciando auditoria e sanitização periódica autônoma (30m)...');
    try {
      const result = await this.heal();
      this.logger.log(`[CONTENT-SCOUT] Auto-Heal finalizado: ${result.fixedCount} reclassificadas, ${result.purgedCount} expurgadas.`);
    } catch (err: any) {
      this.logger.error(`[CONTENT-SCOUT] Erro na sanitização periódica: ${err.message}`);
    }
  }

  /**
   * Constrói mapa dinâmico de clubes por liga a partir do banco de dados
   */
  private async loadDynamicLeagueTeamMap() {
    const leagueTeamsMap = new Map<number, Set<string>>();
    try {
      const standings = await this.prisma.standing.findMany({
        select: {
          league: { select: { externalId: true } },
          team: { select: { name: true } },
        },
      });

      for (const row of standings) {
        const extId = row.league.externalId;
        const name = (row.team.name || '').trim().toLowerCase();
        if (name.length >= 4) {
          if (!leagueTeamsMap.has(extId)) {
            leagueTeamsMap.set(extId, new Set());
          }
          leagueTeamsMap.get(extId)!.add(name);
        }
      }
    } catch (e: any) {
      this.logger.warn(`[CONTENT-SCOUT] Falha ao carregar times dinâmicos do banco: ${e.message}`);
    }
    return leagueTeamsMap;
  }

  /**
   * Avalia conformidade semântica de uma notícia em relação a uma liga
   */
  private evaluateNewsItem(
    item: { id: string; title: string; description?: string | null; content?: string | null; source?: string | null; leagueId?: string | null; league?: { externalId: number; name: string; country: string | null } | null },
    dynamicTeamsMap: Map<number, Set<string>>
  ): {
    isHealthy: boolean;
    violationType?: 'ITALIAN_IN_BRAZIL' | 'BRAZIL_IN_ITALY' | 'SERIE_B_IN_SERIE_A' | 'CROSS_LEAGUE_MISMATCH' | 'NON_COMPLIANT_IRRELEVANT';
    suggestedLeagueExternalId?: number | null;
    detectedTokens: string[];
    severity: 'HIGH' | 'MEDIUM';
    reason: string;
  } {
    const text = `${item.title || ''} ${item.description || ''} ${item.content || ''}`.toLowerCase();
    const source = (item.source || '').toLowerCase();
    const fullSemanticText = `${text} ${source}`;
    const currentExtId = item.league?.externalId;

    // 1. Checagem de Spam / Off-topic absoluto (Não-conforme)
    const detectedSpam = this.SPAM_OR_OFFTOPIC_KEYWORDS.filter(kw => fullSemanticText.includes(kw));
    const hasFootballTerm = this.FOOTBALL_CORE_TERMS.some(kw => fullSemanticText.includes(kw));

    if (detectedSpam.length > 0 && !hasFootballTerm) {
      return {
        isHealthy: false,
        violationType: 'NON_COMPLIANT_IRRELEVANT',
        suggestedLeagueExternalId: null,
        detectedTokens: detectedSpam.slice(0, 5),
        severity: 'HIGH',
        reason: `Conteúdo fora de escopo futebolístico / spam detectado: ${detectedSpam.join(', ')}`,
      };
    }

    // 2. Notícia sem título ou vazia
    if (!item.title || item.title.trim().length < 5) {
      return {
        isHealthy: false,
        violationType: 'NON_COMPLIANT_IRRELEVANT',
        suggestedLeagueExternalId: null,
        detectedTokens: ['titulo_vazio'],
        severity: 'HIGH',
        reason: 'Notícia com título inválido ou vazio.',
      };
    }

    // Identificação de marcadores por competição
    const matchScores = new Map<number, { count: number; tokens: string[] }>();

    for (const [extIdStr, rule] of Object.entries(this.LEAGUE_RULES)) {
      const extId = Number(extIdStr);
      const tokens: string[] = [];

      for (const kw of rule.keywords) {
        if (fullSemanticText.includes(kw)) {
          tokens.push(kw);
        }
      }

      // Adiciona times do banco
      const teams = dynamicTeamsMap.get(extId);
      if (teams) {
        for (const t of teams) {
          if (fullSemanticText.includes(t) && !tokens.includes(t)) {
            tokens.push(t);
          }
        }
      }

      if (tokens.length > 0) {
        matchScores.set(extId, { count: tokens.length, tokens });
      }
    }

    // CASO ESPECÍFICO 1: Brasileirão Série A (71) vs Serie A Itália (135)
    if (currentExtId === 71) {
      const italianMatch = matchScores.get(135);
      const braAMatch = matchScores.get(71);
      const braBMatch = matchScores.get(72);
      const isFromItalianSource = source.includes('football italia') || source.includes('football-italia');

      if ((italianMatch && !braAMatch) || (isFromItalianSource && !braAMatch)) {
        return {
          isHealthy: false,
          violationType: 'ITALIAN_IN_BRAZIL',
          suggestedLeagueExternalId: 135,
          detectedTokens: italianMatch ? italianMatch.tokens.slice(0, 5) : ['football-italia'],
          severity: 'HIGH',
          reason: 'Notícia da Serie A Italiana atribuída ao Brasileirão Série A.',
        };
      }

      if (braBMatch && !braAMatch && !italianMatch) {
        return {
          isHealthy: false,
          violationType: 'SERIE_B_IN_SERIE_A',
          suggestedLeagueExternalId: 72,
          detectedTokens: braBMatch.tokens.slice(0, 5),
          severity: 'MEDIUM',
          reason: 'Notícia estrita do Brasileirão Série B vinculada à Série A.',
        };
      }
    }

    // CASO ESPECÍFICO 2: Serie A Itália (135) com clubes brasileiros
    if (currentExtId === 135) {
      const braAMatch = matchScores.get(71);
      const italianMatch = matchScores.get(135);

      if (braAMatch && !italianMatch) {
        return {
          isHealthy: false,
          violationType: 'BRAZIL_IN_ITALY',
          suggestedLeagueExternalId: 71,
          detectedTokens: braAMatch.tokens.slice(0, 5),
          severity: 'HIGH',
          reason: 'Notícia de clubes brasileiros atribuída à Serie A Italiana.',
        };
      }
    }

    // Checagem geral: A notícia é compatível com a liga atribuída?
    const currentLeagueMatch = currentExtId ? matchScores.get(currentExtId) : undefined;

    if (currentLeagueMatch && currentLeagueMatch.count > 0) {
      // Conforme com a liga atual!
      return {
        isHealthy: true,
        detectedTokens: currentLeagueMatch.tokens.slice(0, 5),
        severity: 'MEDIUM',
        reason: 'Conforme com a liga atribuída.',
      };
    }

    // Se não tem match direto com a liga atual, busca se pertence claramente a outra liga monitorada
    let bestOtherLeagueExtId: number | null = null;
    let highestScore = 0;
    let bestTokens: string[] = [];

    for (const [extId, match] of matchScores.entries()) {
      if (extId !== currentExtId && match.count > highestScore) {
        highestScore = match.count;
        bestOtherLeagueExtId = extId;
        bestTokens = match.tokens;
      }
    }

    if (bestOtherLeagueExtId && highestScore >= 1) {
      return {
        isHealthy: false,
        violationType: 'CROSS_LEAGUE_MISMATCH',
        suggestedLeagueExternalId: bestOtherLeagueExtId,
        detectedTokens: bestTokens.slice(0, 5),
        severity: highestScore >= 2 ? 'HIGH' : 'MEDIUM',
        reason: `Contaminação cruzada: conteúdo pertence à liga #${bestOtherLeagueExtId}`,
      };
    }

    // Se não bate com nenhuma liga monitorada:
    // Verifica se possui ao menos termos futebolísticos básicos
    if (!hasFootballTerm) {
      return {
        isHealthy: false,
        violationType: 'NON_COMPLIANT_IRRELEVANT',
        suggestedLeagueExternalId: null,
        detectedTokens: ['sem_marcador_futebol'],
        severity: 'HIGH',
        reason: 'Notícia sem qualquer relação com futebol ou competições do ecossistema.',
      };
    }

    // Caso possua termos genéricos de futebol mas nenhum clube/liga específico identificado,
    // mantém como saudável para evitar falso-positivo em matérias opinativas gerais.
    return {
      isHealthy: true,
      detectedTokens: [],
      severity: 'MEDIUM',
      reason: 'Matéria de teor futebolístico geral.',
    };
  }

  /**
   * Audita as notícias do banco de dados e retorna telemetria analítica detalhada
   */
  async audit(leagueExternalId?: number): Promise<AuditResult> {
    const totalNews = await this.prisma.news.count();
    const leagues = await this.prisma.league.findMany({
      orderBy: { name: 'asc' },
    });

    const dynamicTeamsMap = await this.loadDynamicLeagueTeamMap();

    const whereClause: any = {};
    if (leagueExternalId) {
      whereClause.league = { externalId: leagueExternalId };
    }

    const recentNews = await this.prisma.news.findMany({
      where: whereClause,
      take: 1000,
      orderBy: { createdAt: 'desc' },
      include: {
        league: true,
      },
    });

    const flaggedItems: AuditResult['flaggedItems'] = [];
    let contaminatedCount = 0;
    let nonCompliantCount = 0;

    const leagueByExtId = new Map<number, { id: string; name: string; country: string | null }>();
    for (const l of leagues) {
      leagueByExtId.set(l.externalId, { id: l.id, name: l.name, country: l.country });
    }

    const formatLeagueBadge = (name: string, country?: string | null, extId?: number | null) => {
      let flag = '🌐';
      const c = (country || '').toLowerCase();
      if (c.includes('brazil') || c.includes('brasil') || extId === 71 || extId === 72) flag = '🇧🇷';
      else if (c.includes('italy') || c.includes('itália') || extId === 135) flag = '🇮🇹';
      else if (c.includes('england') || c.includes('inglaterra') || extId === 39) flag = '🏴󠁧󠁢󠁥󠁮󠁧󠁿';
      else if (c.includes('spain') || c.includes('espanha') || extId === 140) flag = '🇪🇸';
      else if (c.includes('germany') || c.includes('alemanha') || extId === 78) flag = '🇩🇪';
      else if (c.includes('france') || c.includes('frança') || extId === 61) flag = '🇫🇷';

      const countryName = country ? country : (extId === 71 || extId === 72 ? 'Brasil' : extId === 135 ? 'Itália' : '');
      const idTag = extId ? ` #${extId}` : '';
      return `${flag} ${name} (${countryName}${idTag})`;
    };

    for (const item of recentNews) {
      const evaluation = this.evaluateNewsItem(item, dynamicTeamsMap);

      if (!evaluation.isHealthy) {
        if (evaluation.violationType === 'NON_COMPLIANT_IRRELEVANT') {
          nonCompliantCount++;
        } else {
          contaminatedCount++;
        }

        const currentExtId = item.league?.externalId;
        const currentCountry = item.league?.country;
        const currentRawName = item.league?.name || 'Sem Liga Atribuída';
        const currentLeagueDisplay = item.league ? formatLeagueBadge(currentRawName, currentCountry, currentExtId) : '⚪ Sem Liga Atribuída';

        let suggestedLeagueName = 'Expurgo Recomendado (Não Conforme)';
        if (evaluation.suggestedLeagueExternalId) {
          const targetLeagueInfo = leagueByExtId.get(evaluation.suggestedLeagueExternalId);
          suggestedLeagueName = formatLeagueBadge(
            targetLeagueInfo?.name || this.LEAGUE_RULES[evaluation.suggestedLeagueExternalId]?.name || `Liga #${evaluation.suggestedLeagueExternalId}`,
            targetLeagueInfo?.country || this.LEAGUE_RULES[evaluation.suggestedLeagueExternalId]?.country,
            evaluation.suggestedLeagueExternalId
          );
        }

        flaggedItems.push({
          id: item.id,
          title: item.title,
          source: item.source,
          currentLeagueId: item.leagueId,
          currentLeagueName: currentLeagueDisplay,
          suggestedLeagueExternalId: evaluation.suggestedLeagueExternalId || null,
          suggestedLeagueName,
          violationType: evaluation.violationType || 'GENERIC_MISMATCH',
          severity: evaluation.severity,
          detectedTokens: evaluation.detectedTokens,
          createdAt: item.createdAt,
        });
      }
    }

    // Resumo por liga
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
    const healthyCount = totalAudited - (contaminatedCount + nonCompliantCount);
    const complianceRate = totalAudited > 0 ? Number(((healthyCount / totalAudited) * 100).toFixed(1)) : 100;

    return {
      summary: {
        totalNews,
        totalAudited,
        contaminatedCount,
        nonCompliantCount,
        healthyCount,
        complianceRate,
        lastAuditTimestamp: new Date().toISOString(),
      },
      leagues: leaguesOverview.filter(l => l.totalNews > 0 || l.contaminatedNews > 0 || [71, 72, 135, 39, 140, 622, 624, 475].includes(l.externalId)),
      flaggedItems: flaggedItems.slice(0, 150),
    };
  }

  /**
   * Sanitiza a base de notícias:
   * 1. Reclassifica contaminações para as ligas corretas do ecossistema.
   * 2. Elimina/expurga notícias não conformes (spam, off-topic ou sem pertinência futebolística).
   */
  async sanitize(options?: {
    purgeNonCompliant?: boolean;
    leagueExternalId?: number;
    maxItems?: number;
  }): Promise<SanitizeResult> {
    const purgeNonCompliant = options?.purgeNonCompliant !== false; // Padrão: true
    const maxItems = options?.maxItems || 2000;
    this.logger.log(`[CONTENT-SCOUT] Iniciando rotina profunda de sanitização (purgeNonCompliant=${purgeNonCompliant}, limit=${maxItems})...`);

    const leagues = await this.prisma.league.findMany();
    const leagueByExtId = new Map<number, any>();
    for (const l of leagues) {
      leagueByExtId.set(l.externalId, l);
    }

    const dynamicTeamsMap = await this.loadDynamicLeagueTeamMap();

    const whereClause: any = {};
    if (options?.leagueExternalId) {
      whereClause.league = { externalId: options.leagueExternalId };
    }

    const allNews = await this.prisma.news.findMany({
      where: whereClause,
      take: maxItems,
      orderBy: { createdAt: 'desc' },
      include: { league: true },
    });

    let healthyCount = 0;
    let reclassifiedCount = 0;
    let purgedCount = 0;
    let nonCompliantCount = 0;

    const reclassifiedItems: SanitizeResult['reclassifiedItems'] = [];
    const purgedItems: SanitizeResult['purgedItems'] = [];

    for (const item of allNews) {
      const evaluation = this.evaluateNewsItem(item, dynamicTeamsMap);

      if (evaluation.isHealthy) {
        healthyCount++;
        continue;
      }

      // Caso 1: Contaminação Cruzada -> Reclassifica para a liga correta
      if (evaluation.suggestedLeagueExternalId) {
        const targetLeague = leagueByExtId.get(evaluation.suggestedLeagueExternalId);
        if (targetLeague && targetLeague.id !== item.leagueId) {
          try {
            await this.prisma.news.update({
              where: { id: item.id },
              data: { leagueId: targetLeague.id },
            });
            reclassifiedCount++;
            reclassifiedItems.push({
              id: item.id,
              title: item.title,
              fromLeague: item.league?.name || 'Desconhecida',
              toLeague: `${targetLeague.name} (#${targetLeague.externalId})`,
            });
          } catch (err: any) {
            this.logger.error(`[CONTENT-SCOUT] Falha ao reclassificar notícia ${item.id}: ${err.message}`);
          }
          continue;
        }
      }

      // Caso 2: Não conforme / Irrelevante / Fora de Escopo
      if (evaluation.violationType === 'NON_COMPLIANT_IRRELEVANT') {
        nonCompliantCount++;

        if (purgeNonCompliant) {
          try {
            await this.prisma.news.delete({
              where: { id: item.id },
            });
            purgedCount++;
            purgedItems.push({
              id: item.id,
              title: item.title,
              league: item.league?.name || 'Sem Liga',
              reason: evaluation.reason,
            });
            this.logger.log(`[CONTENT-SCOUT] Notícia não conforme expurgada: "${item.title}" [${evaluation.reason}]`);
          } catch (err: any) {
            this.logger.error(`[CONTENT-SCOUT] Falha ao expurgar notícia ${item.id}: ${err.message}`);
          }
        }
      }
    }

    this.logger.log(`[CONTENT-SCOUT] Sanitização concluída: ${reclassifiedCount} reclassificadas, ${purgedCount} expurgadas, ${healthyCount} conformes.`);

    return {
      success: true,
      totalAudited: allNews.length,
      healthyCount,
      reclassifiedCount,
      purgedCount,
      nonCompliantCount,
      reclassifiedItems: reclassifiedItems.slice(0, 100),
      purgedItems: purgedItems.slice(0, 100),
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Executa a faxina e reclassificação em lote (Auto-Healer)
   * Mantém retrocompatibilidade completa com chamadas existentes ao heal()
   */
  async heal() {
    this.logger.log('[CONTENT-SCOUT] Executando rotina heal() integrada com sanitização e expurgo...');
    const result = await this.sanitize({ purgeNonCompliant: true, maxItems: 2000 });

    return {
      success: true,
      fixedCount: result.reclassifiedCount,
      purgedCount: result.purgedCount,
      fixedItems: result.reclassifiedItems.slice(0, 50),
      purgedItems: result.purgedItems.slice(0, 50),
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
