import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';
import { PrismaService } from '../prisma/prisma.service';
import { PocketbaseCommentsClient } from './providers/pocketbase-comments.client';
import { Crawl4aiClient } from './providers/crawl4ai.client';
import {
  CommentPhase,
  CommentSentiment,
  FixtureCommentRecord,
  GenerateCommentDto,
  TacticalAgentResponse,
  TacticalPromptConfig,
} from './interfaces/tactical-comments.types';

interface FixtureUrlCacheEntry {
  url: string;
  isLiveUrl: boolean;
  discoveredAt: number;
}

interface MatchStateCacheEntry {
  lastCrawledLances?: string;
  lastCrawledAt?: number;
}

@Injectable()
export class TacticalCommentsService {
  private readonly logger = new Logger(TacticalCommentsService.name);

  // Ligas homologadas inicialmente: Brasileirão Série A (71) e Série B (72)
  private readonly SUPPORTED_LEAGUES = [71, 72];

  // Cache em memória de URLs de cobertura descobertas para cada partida
  private readonly fixtureUrlCache = new Map<number, FixtureUrlCacheEntry>();

  // Cache em memória de estado e lances da partida (evita chamadas redundantes ao Crawl4AI)
  private readonly matchStateCache = new Map<number, MatchStateCacheEntry>();

  private genAI: GoogleGenerativeAI | null = null;
  private openai: OpenAI | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly pbCommentsClient: PocketbaseCommentsClient,
    private readonly crawl4aiClient: Crawl4aiClient,
  ) {
    this.initializeAiClients();
  }

  private initializeAiClients() {
    // 1. Inicializa OpenAI se configurado
    const openaiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (openaiKey) {
      this.openai = new OpenAI({ apiKey: openaiKey });
      this.logger.log('OpenAI Client inicializado com sucesso para Comentários Táticos (gpt-4o-mini).');
    }

    // 2. Inicializa Gemini se configurado
    const geminiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (geminiKey) {
      this.genAI = new GoogleGenerativeAI(geminiKey);
      this.logger.log('Gemini AI Client inicializado com sucesso para Comentários Táticos (gemini-1.5-flash).');
    }
  }

  /**
   * Obtém a timeline cronológica completa de comentários de uma partida
   */
  async getComments(fixtureExternalId: number): Promise<{
    fixtureId: number;
    total: number;
    comments: FixtureCommentRecord[];
  }> {
    const comments = await this.pbCommentsClient.getCommentsByFixture(fixtureExternalId);
    return {
      fixtureId: fixtureExternalId,
      total: comments.length,
      comments,
    };
  }

  /**
   * Obtém a configuração de calibração do prompt tático
   */
  async getPromptConfig(): Promise<TacticalPromptConfig> {
    return this.pbCommentsClient.getPromptConfig();
  }

  /**
   * Atualiza a configuração de calibração do prompt tático
   */
  async savePromptConfig(config: Partial<TacticalPromptConfig>): Promise<TacticalPromptConfig | null> {
    return this.pbCommentsClient.savePromptConfig(config);
  }

  /**
   * Pre-aquece e atualiza o contexto do Crawl4AI em background a cada 5 minutos durante partidas ao vivo
   */
  async prewarmLiveExternalContext(
    fixtureExternalId: number,
    homeTeam: string,
    awayTeam: string,
  ): Promise<string | null> {
    try {
      const config = await this.pbCommentsClient.getPromptConfig();
      if (config.enable_crawl4ai === false) return null;

      const now = Date.now();
      const state = this.matchStateCache.get(fixtureExternalId) || {};
      // Se foi coletado há menos de 4 minutos, retorna o que já está em cache
      if (state.lastCrawledAt && now - state.lastCrawledAt < 4 * 60 * 1000 && state.lastCrawledLances) {
        return state.lastCrawledLances;
      }

      // 1. Obtém ou descobre URL de tempo real ao vivo
      let liveUrl: string | null = null;
      const cached = this.fixtureUrlCache.get(fixtureExternalId);
      if (cached && cached.isLiveUrl && now - cached.discoveredAt < 3 * 3600 * 1000) {
        liveUrl = cached.url;
      } else {
        const sources = (config.crawl_sources || 'ge.globo.com,lance.com.br,uol.com.br')
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
        liveUrl = await this.crawl4aiClient.discoverMatchLiveUrl(homeTeam, awayTeam, sources, true);
        if (liveUrl) {
          this.fixtureUrlCache.set(fixtureExternalId, {
            url: liveUrl,
            isLiveUrl: true,
            discoveredAt: now,
          });
        }
      }

      if (!liveUrl) return null;

      // 2. Extrai lances com sessão persistente e seletor cirúrgico
      const markdown = await this.crawl4aiClient.crawlSync(liveUrl, {
        timeoutMs: 12000,
        sessionId: `match_${fixtureExternalId}`,
        cssSelector: '.transmissao-live, article, .feed-post-body, .m-transmissao',
        waitFor: 'css:article, .transmissao-live, .feed-post-body',
      });

      if (markdown && markdown.length > 50) {
        const cleanLances = markdown.slice(0, 3200);
        this.matchStateCache.set(fixtureExternalId, {
          ...state,
          lastCrawledLances: cleanLances,
          lastCrawledAt: now,
        });
        return cleanLances;
      }

      return null;
    } catch (err: any) {
      this.logger.warn(
        `[PrewarmLive] Falha ao pré-aquecer lances para fixture ${fixtureExternalId}: ${err.message}`,
      );
      return null;
    }
  }

  /**
   * Dispara a geração de um comentário tático para a partida
   */
  async generateTacticalComment(
    fixtureExternalId: number,
    dto: GenerateCommentDto = {},
  ): Promise<TacticalAgentResponse> {
    try {
      // 1. Busca os dados da partida no banco local
      const fixture = await this.prisma.fixture.findFirst({
        where: { externalId: fixtureExternalId },
        include: {
          homeTeam: true,
          awayTeam: true,
          league: true,
          stats: true,
          events: true,
          lineups: true,
        },
      });

      if (!fixture) {
        return {
          success: false,
          message: `Partida ${fixtureExternalId} não encontrada no banco de dados.`,
        };
      }

      const leagueExternalId = fixture.league.externalId;
      if (!this.SUPPORTED_LEAGUES.includes(leagueExternalId)) {
        this.logger.warn(
          `[TacticalComments] Partida ${fixtureExternalId} pertence à liga ${leagueExternalId}, fora do escopo inicial (71, 72). Prosseguindo com aviso.`,
        );
      }

      // 2. Determina a fase e o minuto da partida
      const phase = dto.phase || this.determineMatchPhase(fixture.statusShort);
      const minute = dto.minute ?? (fixture.elapsed || this.getDefaultMinuteForPhase(phase));
      const isLivePhase = ['FIRST_HALF', 'SECOND_HALF', 'HALF_TIME'].includes(phase);

      // 3. Busca contexto externo via Crawl4AI com estratégias assertivas por fase
      const config = await this.pbCommentsClient.getPromptConfig();
      let externalContext: string | null = null;

      if (config.enable_crawl4ai !== false) {
        if (dto.externalContextUrl) {
          externalContext = await this.crawl4aiClient.crawlSync(dto.externalContextUrl, {
            timeoutMs: 10000,
            sessionId: `match_${fixtureExternalId}`,
            cssSelector: '.transmissao-live, article, .feed-post-body',
          });
        } else if (isLivePhase) {
          externalContext = await this.prewarmLiveExternalContext(
            fixtureExternalId,
            fixture.homeTeam.name,
            fixture.awayTeam.name,
          );
        } else {
          // Fase Pré-Jogo ou Pós-Jogo (artigo analítico ou escalações)
          const now = Date.now();
          let previewUrl: string | null = null;
          const cached = this.fixtureUrlCache.get(fixtureExternalId);
          if (cached && !cached.isLiveUrl && now - cached.discoveredAt < 4 * 3600 * 1000) {
            previewUrl = cached.url;
          } else {
            const sources = (config.crawl_sources || 'ge.globo.com,lance.com.br,uol.com.br')
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean);
            previewUrl = await this.crawl4aiClient.discoverMatchLiveUrl(
              fixture.homeTeam.name,
              fixture.awayTeam.name,
              sources,
              false,
            );
            if (previewUrl) {
              this.fixtureUrlCache.set(fixtureExternalId, {
                url: previewUrl,
                isLiveUrl: false,
                discoveredAt: now,
              });
            }
          }

          if (previewUrl) {
            const rawPreview = await this.crawl4aiClient.crawlSync(previewUrl, {
              timeoutMs: 10000,
              sessionId: `match_${fixtureExternalId}`,
              cssSelector: 'article, main, .feed-post-body, .m-materia',
            });
            if (rawPreview) {
              externalContext = rawPreview.slice(0, 2500);
            }
          }
        }
      }

      // 4. Monta o snapshot estatístico
      const statsSnapshot = this.buildStatsSnapshot(fixture.stats, fixture.homeTeamId, fixture.awayTeamId);

      // 5. Memória Factual Acumulada: Linha do tempo de eventos críticos
      const criticalEvents = (fixture.events || [])
        .filter(
          (e: any) =>
            ['Goal', 'Card', 'Var'].includes(e.type) ||
            e.detail?.toLowerCase().includes('red') ||
            e.detail?.toLowerCase().includes('gol') ||
            e.detail?.toLowerCase().includes('penalty'),
        )
        .map(
          (e: any) =>
            `${e.time?.elapsed || 0}' [${(e.type || '').toUpperCase()}] ${e.player?.name || ''} (${e.team?.name || ''}) - ${e.detail || ''}`,
        );

      // 6. Memória Narrativa: Histórico completo de comentários anteriores para continuidade do arco
      const existingComments = await this.pbCommentsClient.getCommentsByFixture(fixtureExternalId);
      const previousTheses = existingComments.map(
        (c) =>
          `[${c.phase} ${c.minute !== undefined ? `${c.minute}'` : ''}]: Título: "${c.title}" | Resumo: "${c.comment.substring(0, 110)}..."`,
      );
      const recentComments = existingComments.slice(-3);

      // 7. Gera a leitura tática via LLM com Prompt Caching nativo
      const insight = await this.generateInsight({
        homeTeam: fixture.homeTeam.name,
        awayTeam: fixture.awayTeam.name,
        homeScore: fixture.homeGoals ?? 0,
        awayScore: fixture.awayGoals ?? 0,
        statusShort: fixture.statusShort || 'NS',
        elapsed: minute,
        phase,
        events: fixture.events.slice(-8), // últimos 8 eventos detalhados
        criticalEvents,
        previousTheses,
        stats: statsSnapshot,
        externalContext,
        recentComments,
      });

      // 6. Grava no PocketBase Comentários dedicado
      const savedRecord = await this.pbCommentsClient.saveComment({
        fixture_id: fixtureExternalId,
        league_id: leagueExternalId,
        minute,
        phase,
        title: insight.title,
        comment: insight.comment,
        sentiment: insight.sentiment,
        stats_snapshot: statsSnapshot,
      });

      if (!savedRecord) {
        return {
          success: false,
          message: 'Falha ao persistir comentário na instância do PocketBase.',
        };
      }

      return {
        success: true,
        data: savedRecord,
      };
    } catch (err: any) {
      this.logger.error(`Erro ao gerar comentário tático: ${err.message}`);
      return {
        success: false,
        message: err.message,
      };
    }
  }

  private determineMatchPhase(statusShort?: string | null): CommentPhase {
    if (!statusShort || ['NS', 'TBD'].includes(statusShort)) return 'PRE_MATCH';
    if (statusShort === '1H') return 'FIRST_HALF';
    if (statusShort === 'HT') return 'HALF_TIME';
    if (statusShort === '2H') return 'SECOND_HALF';
    if (['FT', 'AET', 'PEN'].includes(statusShort)) return 'FULL_TIME';
    return 'FIRST_HALF';
  }

  private getDefaultMinuteForPhase(phase: CommentPhase): number {
    switch (phase) {
      case 'PRE_MATCH':
        return 0;
      case 'FIRST_HALF':
        return 25;
      case 'HALF_TIME':
        return 45;
      case 'SECOND_HALF':
        return 70;
      case 'FULL_TIME':
        return 90;
    }
  }

  private buildStatsSnapshot(stats: any[], homeTeamId: string, awayTeamId: string): Record<string, any> {
    const summary: Record<string, any> = { home: {}, away: {} };
    for (const s of stats) {
      const isHome = s.teamId?.toString() === homeTeamId;
      const side = isHome ? 'home' : 'away';
      summary[side][s.type] = s.value;
    }
    return summary;
  }

  private async generateInsight(context: {
    homeTeam: string;
    awayTeam: string;
    homeScore: number;
    awayScore: number;
    statusShort: string;
    elapsed: number;
    phase: CommentPhase;
    events: any[];
    criticalEvents?: string[];
    previousTheses?: string[];
    stats: any;
    externalContext: string | null;
    recentComments?: FixtureCommentRecord[];
  }): Promise<{ title: string; comment: string; sentiment: CommentSentiment }> {
    const provider = (this.configService.get<string>('AI_PROVIDER') || 'OPENAI').toUpperCase();

    if (!this.openai && !this.genAI) {
      return {
        title: `${context.homeTeam} ${context.homeScore} x ${context.awayScore} ${context.awayTeam}`,
        comment: `Partida movimentada na fase ${context.phase}. Análise tática aguardando ativação da IA.`,
        sentiment: 'EQUILIBRADO',
      };
    }

    // Carrega a configuração dinâmica calibrada pelo AdminPanel
    const config = await this.pbCommentsClient.getPromptConfig();

    const coachPct = 100 - config.coach_vs_fan;
    const fanPct = config.coach_vs_fan;

    let toneDescription = 'Tom equilibrado e dinâmico, resenha esportiva moderna.';
    if (config.casualness <= 25) {
      toneDescription = 'Tom formal, sóbrio e estritamente analítico/jornalístico.';
    } else if (config.casualness <= 60) {
      toneDescription = 'Tom equilibrado, dinâmico e direto, como um bom debate esportivo moderno.';
    } else if (config.casualness <= 85) {
      toneDescription = 'Tom bem casual, resenha de boleiro inteligente, vocabulário autêntico do futebol brasileiro, sem academicismo excessivo.';
    } else {
      toneDescription = 'Tom ultra casual de pura resenha de torcedor e bate-papo de arquibancada, vibrante e bem humorado.';
    }

    // Controle de tamanho do texto por fase
    let lengthInstruction = '';
    const isLive = context.phase === 'FIRST_HALF' || context.phase === 'SECOND_HALF';
    if (isLive) {
      if (config.live_length === 'FLASH') {
        lengthInstruction = 'TAMANHO ULTRA-CURTO / FLASH: No máximo 2 frases diretas e objetivas (cerca de 25 a 35 palavras). Vá direto ao ponto sem rodeios.';
      } else if (config.live_length === 'SHORT') {
        lengthInstruction = 'TAMANHO CURTO (METADE DO PADRÃO): Exatamente 1 parágrafo enxuto, ágil e direto (cerca de 40 a 50 palavras). Leitura rápida do momento atual em campo.';
      } else {
        lengthInstruction = 'TAMANHO PADRÃO: 1 a 2 parágrafos objetivos (cerca de 70 a 90 palavras).';
      }
    } else {
      if (config.pause_length === 'SUMMARY') {
        lengthInstruction = 'TAMANHO SÍNTESE: 1 parágrafo bem consolidado com os pontos capitais (cerca de 50 a 60 palavras).';
      } else {
        lengthInstruction = 'TAMANHO COMPLETO E APROFUNDADO: 1 a 2 parágrafos densos e analíticos (cerca de 80 a 120 palavras), dissecando o panorama da partida.';
      }
    }

    const focusPoints: string[] = [];
    if (config.focus_highlights) {
      focusPoints.push('- Destaque atuações individuais e jogadores decisivos (melhor/pior em campo, jogadas de destaque).');
    }
    if (config.focus_table_impact) {
      focusPoints.push('- Contextualize a pontuação e o impacto na tabela (briga por G4, liderança ou fuga do Z4).');
    }
    if (config.focus_substitutions) {
      focusPoints.push('- Avalie as substituições feitas pelos técnicos e a mudança de desenho tático.');
    }

    const phaseInstructions: Record<CommentPhase, string> = {
      PRE_MATCH:
        'Foco no Pré-Jogo: Expectativas táticas, postura esperada das equipes (propositiva vs reativa), disputa setorial e escalações.',
      FIRST_HALF:
        'Foco no 1º Tempo: Ritmo inicial, encaixe de marcação, aproveitamento das transições e momentos de perigo.',
      HALF_TIME:
        'Foco no Intervalo: Leitura dos primeiros 45 minutos, quem controlou o jogo e quais ajustes táticos os técnicos precisam fazer para o 2º tempo.',
      SECOND_HALF:
        'Foco no 2º Tempo: Mudança de postura pós-substituições, desgaste físico, pressão no campo adversário e efetividade.',
      FULL_TIME:
        'Foco no Pós-Jogo / Resumo: Balanço tático completo dos 90 minutos, mérito no resultado, destaques individuais e impacto na competição.',
    };

    let phaseInstruction = phaseInstructions[context.phase];
    if (context.phase === 'FIRST_HALF') {
      if (context.elapsed <= 20) {
        phaseInstruction =
          'Foco no Início do 1º Tempo (Janela inicial): Ritmo inicial, encaixe de marcação, disposição em campo e estudo mútuo entre as equipes.';
      } else {
        phaseInstruction =
          'Foco durante o 1º Tempo (Andamento consolidado): Como as equipes se assentaram no gramado, criação de chances, posse efetiva e controle tático.';
      }
    } else if (context.phase === 'SECOND_HALF') {
      if (context.elapsed <= 62) {
        phaseInstruction =
          'Foco no Início do 2º Tempo (Retorno do intervalo): Mudanças de postura após a conversa de vestiário, substituições feitas no intervalo e novo ímpeto em campo.';
      } else {
        phaseInstruction =
          'Foco durante o 2º Tempo (Reta final e desfecho): Desgaste físico, alterações táticas dos técnicos, pressão em busca do placar e organização sob tensão.';
      }
    }

    const systemPrompt = `Você é um comentarista e analista tático especializado no futebol brasileiro (Brasileirão Série A e B).
Sua missão é produzir leituras táticas de alto nível, autênticas, perspicazes e dinâmicas, no formato de resenha esportiva inteligente.

REGRAS OBRIGATÓRIAS DE IDIOMA E FORMATAÇÃO (RIGOROSO):
1. OBEDEÇA RIGOROSAMENTE AO IDIOMA (SEM MISTURA DE LÍNGUAS):
   - O texto em português deve ser 100% natural, com ZERO estrangeirismos.
   - NÃO use termos em inglês como:
     * "clean sheet" (use "sem sofrer gols" ou "baliza zerada")
     * "pressing" ou "press" (use "pressão alta", "marcação agressiva" ou "pressão pós-perda")
     * "box-to-box" (use "volante de área a área" ou "meio-campista dinâmico")
     * "turnover" (use "perda de posse" ou "recuperação de bola")
     * "build-up" (use "construção de jogada" ou "saída de bola")
     * "lineup" (use "escalação" ou "time titular")
     * "winger" ou "striker" (use "ponta", "extremo", "centroavante" ou "atacante")
     * "half-time" ou "full-time" (use "intervalo", "fim de jogo" ou "apito final")
2. Responda ESTRITAMENTE em formato JSON puro, sem blocos markdown adicionais.
3. Título ("title"): Manchete de impacto tático, máximo 10 palavras, 100% em português puro sem jargões em inglês.
4. Comentário ("comment"): Respeite estritamente a extensão solicitada pelo usuário no prompt.
5. Sentimento ("sentiment"): Escolha uma das opções rigorosamente em português (em maiúsculo):
   - "EQUILIBRADO" (jogos parelhos e disputa tática equilibrada)
   - "DOMINANTE" (amplo controle de jogo, pressão e superioridade)
   - "CRITICO" (expulsão, pênalti decisivo, momento de alta tensão)
   - "SURPRESA" (zebra, resultado inesperado ou virada improvável)

FORMATO JSON ESPERADO:
{
  "title": "<manchete curta pura em português>",
  "comment": "<análise tática respeitando o tamanho solicitado>",
  "sentiment": "EQUILIBRADO" | "DOMINANTE" | "CRITICO" | "SURPRESA"
}`;

    const userPrompt = `
LEITURA TÁTICA DA PARTIDA:
CONFRONTO: ${context.homeTeam} ${context.homeScore} x ${context.awayScore} ${context.awayTeam}
FASE ATUAL: ${context.phase} (Minuto: ${context.elapsed}')
STATUS: ${context.statusShort}

CALIBRAÇÃO DE ESTILO E TOM:
- PERSPECTIVA: ${coachPct}% Visão do Técnico (prancheta, linhas) e ${fanPct}% Visão do Torcedor (emoção, vibração).
- GRAU DE CASUALIDADE / RESENHA: ${config.casualness}% (${toneDescription}).
- DIRETRIZ DE EXTENSÃO DO COMENTÁRIO: ${lengthInstruction}
${focusPoints.length > 0 ? `\nFOCOS ADICIONAIS:\n${focusPoints.join('\n')}` : ''}
${config.custom_rules ? `\nREGRAS PERSONALIZADAS DO USUÁRIO:\n${config.custom_rules}\n` : ''}

MEMÓRIA FACTUAL DA PARTIDA (LINHA DO TEMPO CRÍTICA ACUMULADA):
${context.criticalEvents && context.criticalEvents.length > 0 ? context.criticalEvents.join('\n') : 'Nenhum evento crítico acumulado até o momento.'}

ARCO NARRATIVO E CONTINUIDADE (ANÁLISES ANTERIORES DA IA NESTA PARTIDA):
${context.previousTheses && context.previousTheses.length > 0 ? context.previousTheses.join('\n') : 'Primeira leitura da partida.'}
(DIRETRIZ DE CONTINUIDADE: Conecte sua análise com o que foi apontado anteriormente, mostrando evolução do jogo sem jamais repetir o mesmo texto ou tese!)

LANCES RECENTES NARRADOS EM CAMPO (COLETADOS PELO CRAWL4AI):
${context.externalContext ? context.externalContext : 'Sem contexto externo adicional no momento.'}

ESTATÍSTICAS ATUAIS:
${JSON.stringify(context.stats, null, 2)}

ÚLTIMOS EVENTOS DETALHADOS:
${JSON.stringify(context.events, null, 2)}

DIRETRIZ DA FASE ATUAL:
${phaseInstruction}
`;

    const normalizeSentiment = (raw?: string): CommentSentiment => {
      const s = (raw || '').toUpperCase().trim();
      if (s === 'SURPRISE' || s === 'SURPRESA') return 'SURPRESA';
      if (s === 'DOMINANT' || s === 'DOMINANTE') return 'DOMINANTE';
      if (s === 'CRITICAL' || s === 'CRITICO' || s === 'CRÍTICO') return 'CRITICO';
      return 'EQUILIBRADO';
    };

    // 1. Tenta com OpenAI se for o provider selecionado ou se disponível (com Prompt Caching no system message)
    if ((provider === 'OPENAI' || !this.genAI) && this.openai) {
      try {
        const completion = await this.openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: systemPrompt,
            },
            { role: 'user', content: userPrompt },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.4,
        });

        const rawText = completion.choices[0].message.content || '{}';
        const parsed = JSON.parse(rawText);

        return {
          title: parsed.title || `${context.homeTeam} x ${context.awayTeam}`,
          comment: parsed.comment || 'Análise tática em andamento.',
          sentiment: normalizeSentiment(parsed.sentiment),
        };
      } catch (openAiErr: any) {
        this.logger.warn(`Erro na chamada OpenAI: ${openAiErr.message}. Tentando Gemini como fallback se disponível.`);
      }
    }

    // 2. Tenta com Gemini se OpenAI não rodou ou se for o provider selecionado (com systemInstruction)
    if (this.genAI) {
      try {
        const model = this.genAI.getGenerativeModel({
          model: 'gemini-1.5-flash',
          systemInstruction: systemPrompt,
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.4,
          },
        });

        const result = await model.generateContent(userPrompt);
        let text = result.response.text().trim();

        if (text.startsWith('```')) {
          text = text.replace(/^```json\s*/, '').replace(/```$/, '').trim();
        }

        const parsed = JSON.parse(text);
        return {
          title: parsed.title || `${context.homeTeam} x ${context.awayTeam}`,
          comment: parsed.comment || 'Análise tática em andamento.',
          sentiment: normalizeSentiment(parsed.sentiment),
        };
      } catch (geminiErr: any) {
        this.logger.warn(`Erro na chamada Gemini: ${geminiErr.message}.`);
      }
    }

    // 3. Fallback gracioso caso ambos falhem
    return {
      title: `${context.homeTeam} ${context.homeScore} x ${context.awayScore} ${context.awayTeam}`,
      comment: `Duelo equilibrado entre ${context.homeTeam} e ${context.awayTeam}. As equipes disputam o controle da partida na fase ${context.phase}.`,
      sentiment: 'EQUILIBRADO',
    };
  }
}
