import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
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

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly pbCommentsClient: PocketbaseCommentsClient,
    private readonly crawl4aiClient: Crawl4aiClient,
  ) {
    const geminiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (geminiKey) {
      this.genAI = new GoogleGenerativeAI(geminiKey);
      this.logger.log('Gemini AI Client inicializado para o Agente de Comentários Táticos.');
    } else {
      this.logger.warn('GEMINI_API_KEY não encontrada nas variáveis de ambiente.');
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

      // 5. Gera a leitura tática via Gemini
      const insight = await this.generateInsightWithGemini({
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

  private async generateInsightWithGemini(context: {
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
    if (!this.genAI) {
      return {
        title: `${context.homeTeam} ${context.homeScore} x ${context.awayScore} ${context.awayTeam}`,
        comment: `Partida movimentada na fase ${context.phase}. Análise tática aguardando ativação da IA.`,
        sentiment: 'BALANCED',
      };
    }

    const phaseInstructions: Record<CommentPhase, string> = {
      PRE_MATCH:
        'Foco no Pré-Jogo: Expectativas táticas, desfalques, postura esperada das equipes (propositiva vs reativa) e disputa setorial.',
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

REGRAS OBRIGATÓRIAS:
1. Responda ESTRITAMENTE em formato JSON.
2. Não inclua blocos markdown fora do JSON.
3. Idioma: Português do Brasil (pt-BR), tom jornalístico e analítico.
4. Título ("title"): Manchete de impacto tático, máximo 10 palavras.
5. Comentário ("comment"): Análise tática rica e fluida (1 a 2 parágrafos objetivos).
6. Sentimento ("sentiment"): Escolha uma das opções: "DOMINANT", "BALANCED", "CRITICAL", "SURPRISE".

FORMATO JSON ESPERADO:
{
  "title": "<manchete curta>",
  "comment": "<parágrafo analítico detalhado>",
  "sentiment": "DOMINANT" | "BALANCED" | "CRITICAL" | "SURPRISE"
}
`;

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
    } catch (err: any) {
      this.logger.warn(`Erro na chamada do Gemini: ${err.message}. Aplicando fallback.`);
      return {
        title: `${context.homeTeam} ${context.homeScore} x ${context.awayScore} ${context.awayTeam}`,
        comment: `Duelo intenso entre ${context.homeTeam} e ${context.awayTeam}. As equipes disputam o controle do meio de campo na fase ${context.phase}.`,
        sentiment: 'BALANCED',
      };
    }
  }
}
