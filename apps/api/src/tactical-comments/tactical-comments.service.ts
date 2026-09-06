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
} from './interfaces/tactical-comments.types';

@Injectable()
export class TacticalCommentsService {
  private readonly logger = new Logger(TacticalCommentsService.name);

  // Ligas homologadas inicialmente: Brasileirão Série A (71) e Série B (72)
  private readonly SUPPORTED_LEAGUES = [71, 72];

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

      // 3. Busca contexto externo via Crawl4AI se fornecido
      let externalContext: string | null = null;
      if (dto.externalContextUrl) {
        externalContext = await this.crawl4aiClient.crawlSync(dto.externalContextUrl, 6000);
      }

      // 4. Monta o snapshot estatístico
      const statsSnapshot = this.buildStatsSnapshot(fixture.stats, fixture.homeTeamId, fixture.awayTeamId);

      // 5. Gera a leitura tática via LLM (OpenAI ou Gemini)
      const insight = await this.generateInsight({
        homeTeam: fixture.homeTeam.name,
        awayTeam: fixture.awayTeam.name,
        homeScore: fixture.homeGoals ?? 0,
        awayScore: fixture.awayGoals ?? 0,
        statusShort: fixture.statusShort || 'NS',
        elapsed: minute,
        phase,
        events: fixture.events.slice(-8), // últimos 8 eventos
        stats: statsSnapshot,
        externalContext: externalContext ? externalContext.slice(0, 1500) : null,
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
    stats: any;
    externalContext: string | null;
  }): Promise<{ title: string; comment: string; sentiment: CommentSentiment }> {
    const provider = (this.configService.get<string>('AI_PROVIDER') || 'OPENAI').toUpperCase();

    if (!this.openai && !this.genAI) {
      return {
        title: `${context.homeTeam} ${context.homeScore} x ${context.awayScore} ${context.awayTeam}`,
        comment: `Partida movimentada na fase ${context.phase}. Análise tática aguardando ativação da IA.`,
        sentiment: 'BALANCED',
      };
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

    const prompt = `
Você é um comentarista e analista tático especializado no futebol brasileiro (Brasileirão Série A e B).
Gere uma leitura tática de alto nível e tom profissional para a partida:

CONFRONTO: ${context.homeTeam} ${context.homeScore} x ${context.awayScore} ${context.awayTeam}
FASE ATUAL: ${context.phase} (Minuto: ${context.elapsed}')
STATUS: ${context.statusShort}

ESTATÍSTICAS ATUAIS:
${JSON.stringify(context.stats, null, 2)}

ÚLTIMOS EVENTOS (GOLS / CARTÕES / SUBSTITUIÇÕES):
${JSON.stringify(context.events, null, 2)}

${context.externalContext ? `CONTEXTO EXTERNO COLETADO:\n${context.externalContext}\n` : ''}

DIRETRIZES DA FASE:
${phaseInstructions[context.phase]}

REGRAS OBRIGATÓRIAS DE IDIOMA E FORMATAÇÃO:
1. IDIOMA 100% PORTUGUÊS DO BRASIL (pt-BR): O texto deve ser redigido inteiramente em português natural, culto e jornalístico.
2. ZERO EXPRESSÕES EM INGLÊS / ZERO ESTRANGEIRISMOS: É TERMINANTEMENTE PROIBIDO usar palavras ou jargões em inglês no texto em português.
   - NÃO use "clean sheet" (use "sem sofrer gols" ou "baliza zerada").
   - NÃO use "pressing" ou "press" (use "pressão alta", "marcação agressiva" ou "pressão pós-perda").
   - NÃO use "box-to-box" (use "volante de área a área" ou "meio-campista dinâmico").
   - NÃO use "turnover" (use "perda de posse" ou "recuperação de bola").
   - NÃO use "build-up" (use "construção de jogada" ou "saída de bola").
   - NÃO use "lineup" (use "escalação" ou "time titular").
   - NÃO use "winger" ou "striker" (use "ponta", "extremo", "centroavante" ou "atacante").
   - NÃO use "half-time" ou "full-time" no texto do comentário (use "intervalo", "fim de jogo" ou "apito final").
3. Responda ESTRITAMENTE em formato JSON, sem blocos markdown fora do JSON.
4. Título ("title"): Manchete de impacto tático, máximo 10 palavras, 100% em português.
5. Comentário ("comment"): Análise tática rica e fluida (1 a 2 parágrafos analíticos objetivos), 100% em português.
6. Sentimento ("sentiment"): Escolha uma das opções técnicas em maiúsculo: "DOMINANT", "BALANCED", "CRITICAL", "SURPRISE".

FORMATO JSON ESPERADO:
{
  "title": "<manchete curta em português puro>",
  "comment": "<parágrafo analítico detalhado em português puro>",
  "sentiment": "DOMINANT" | "BALANCED" | "CRITICAL" | "SURPRISE"
}
`;

    // 1. Tenta com OpenAI se for o provider selecionado ou se disponível
    if ((provider === 'OPENAI' || !this.genAI) && this.openai) {
      try {
        const completion = await this.openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content:
                'Você é um jornalista e comentarista tático especializado em futebol brasileiro. Redija análises táticas puramente em português brasileiro (pt-BR), sem nenhuma expressão ou termo em inglês. Responda estritamente em JSON.',
            },
            { role: 'user', content: prompt },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.4,
        });

        const rawText = completion.choices[0].message.content || '{}';
        const parsed = JSON.parse(rawText);

        return {
          title: parsed.title || `${context.homeTeam} x ${context.awayTeam}`,
          comment: parsed.comment || 'Análise tática em andamento.',
          sentiment: ['DOMINANT', 'BALANCED', 'CRITICAL', 'SURPRISE'].includes(parsed.sentiment)
            ? parsed.sentiment
            : 'BALANCED',
        };
      } catch (openAiErr: any) {
        this.logger.warn(`Erro na chamada OpenAI: ${openAiErr.message}. Tentando Gemini como fallback se disponível.`);
      }
    }

    // 2. Tenta com Gemini se OpenAI não rodou ou se for o provider selecionado
    if (this.genAI) {
      try {
        const model = this.genAI.getGenerativeModel({
          model: 'gemini-1.5-flash',
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.4,
          },
        });

        const result = await model.generateContent(prompt);
        let text = result.response.text().trim();

        if (text.startsWith('```')) {
          text = text.replace(/^```json\s*/, '').replace(/```$/, '').trim();
        }

        const parsed = JSON.parse(text);
        return {
          title: parsed.title || `${context.homeTeam} x ${context.awayTeam}`,
          comment: parsed.comment || 'Análise tática em andamento.',
          sentiment: ['DOMINANT', 'BALANCED', 'CRITICAL', 'SURPRISE'].includes(parsed.sentiment)
            ? parsed.sentiment
            : 'BALANCED',
        };
      } catch (geminiErr: any) {
        this.logger.warn(`Erro na chamada Gemini: ${geminiErr.message}.`);
      }
    }

    // 3. Fallback gracioso caso ambos falhem
    return {
      title: `${context.homeTeam} ${context.homeScore} x ${context.awayScore} ${context.awayTeam}`,
      comment: `Duelo equilibrado entre ${context.homeTeam} e ${context.awayTeam}. As equipes disputam o controle da partida na fase ${context.phase}.`,
      sentiment: 'BALANCED',
    };
  }
}
