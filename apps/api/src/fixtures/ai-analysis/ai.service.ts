import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';

export interface AiAnalysisResult {
  probHome: number;
  probAway: number;
  probDraw: number;
  predictionSummary: string;
  tips: string[];
  commentary: string;
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private genAI: GoogleGenerativeAI | null = null;
  private openai: OpenAI | null = null;

  constructor(private readonly configService: ConfigService) {
    this.initializeClients();
  }

  private initializeClients() {
    const provider = this.configService.get<string>('AI_PROVIDER', 'GEMINI').toUpperCase();
    
    if (provider === 'GEMINI') {
      const apiKey = this.configService.get<string>('GEMINI_API_KEY');
      if (apiKey) {
        this.genAI = new GoogleGenerativeAI(apiKey);
        this.logger.log('Gemini AI Client initialized successfully.');
      } else {
        this.logger.warn('GEMINI_API_KEY is not defined in environment variables.');
      }
    } else if (provider === 'OPENAI') {
      const apiKey = this.configService.get<string>('OPENAI_API_KEY');
      if (apiKey) {
        this.openai = new OpenAI({ apiKey });
        this.logger.log('OpenAI Client initialized successfully.');
      } else {
        this.logger.warn('OPENAI_API_KEY is not defined in environment variables.');
      }
    }
  }

  async generateMatchAnalysis(matchData: any, lineupsFactored: boolean): Promise<AiAnalysisResult> {
    const provider = this.configService.get<string>('AI_PROVIDER', 'GEMINI').toUpperCase();
    
    const prompt = `
Você é um especialista em análise tática de futebol e palpites esportivos.
Analise a seguinte partida com base nos dados fornecidos:

DADOS DA PARTIDA:
${JSON.stringify(matchData, null, 2)}

INSTRUÇÕES DE RESPOSTA:
1. Responda ESTRITAMENTE em formato JSON.
2. A resposta deve ser apenas o JSON válido, sem comentários adicionais fora do JSON.
3. Se lineupsFactored for verdadeiro, significa que as escalações de hoje estão confirmadas na análise. Leve isso em consideração no seu comentário técnico.
4. Idioma da análise: Português (pt-BR).

FORMATO JSON ESPERADO:
{
  "probHome": <número inteiro de 0 a 100 indicando probabilidade de vitória do time mandante>,
  "probAway": <número inteiro de 0 a 100 indicando probabilidade de vitória do time visitante>,
  "probDraw": <número inteiro de 0 a 100 indicando probabilidade de empate. A soma das 3 probabilidades deve dar exatamente 100>,
  "predictionSummary": "<uma frase curta, direta e marcante resumindo a análise. Máximo 15 palavras>",
  "tips": [<um array de 2 a 3 dicas curtas e diretas de aposta para a partida, ex: ["Ambos Marcam", "Mais de 1.5 gols"]>],
  "commentary": "<um texto completo, de 2 a 3 parágrafos, analisando detalhadamente a partida, os fatores táticos, o momento das equipes e os destaques individuais se fornecidos. Seja analítico e profissional>"
}
`;

    try {
      let rawResponse = '';

      if (provider === 'GEMINI') {
        if (!this.genAI) {
          throw new Error('Gemini client is not initialized. Check GEMINI_API_KEY.');
        }
        const model = this.genAI.getGenerativeModel({
          model: 'gemini-1.5-flash',
          generationConfig: {
            responseMimeType: 'application/json',
          },
        });
        const result = await model.generateContent(prompt);
        rawResponse = result.response.text();
      } else if (provider === 'OPENAI') {
        if (!this.openai) {
          throw new Error('OpenAI client is not initialized. Check OPENAI_API_KEY.');
        }
        const completion = await this.openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: 'Você é um assistente especialista em análise tática de futebol.' },
            { role: 'user', content: prompt }
          ],
          response_format: { type: 'json_object' },
        });
        rawResponse = completion.choices[0].message.content || '';
      } else {
        throw new Error(`Unsupported AI provider: ${provider}`);
      }

      return this.parseAndValidateResponse(rawResponse);
    } catch (error) {
      this.logger.error(`Error generating AI analysis: ${error.message}`);
      throw error;
    }
  }

  private parseAndValidateResponse(rawResponse: string): AiAnalysisResult {
    let cleanResponse = rawResponse.trim();
    
    // Remover blocos de código markdown se o modelo tiver retornado
    if (cleanResponse.startsWith('```')) {
      cleanResponse = cleanResponse
        .replace(/^```json\s*/, '')
        .replace(/```$/, '')
        .trim();
    }

    const data = JSON.parse(cleanResponse);

    // Validação básica de estrutura e tipos
    const probHome = typeof data.probHome === 'number' ? Math.round(data.probHome) : 34;
    const probAway = typeof data.probAway === 'number' ? Math.round(data.probAway) : 33;
    const probDraw = typeof data.probDraw === 'number' ? Math.round(data.probDraw) : 33;
    
    // Ajustar a soma para exatamente 100 se necessário
    const sum = probHome + probAway + probDraw;
    let finalProbHome = probHome;
    if (sum !== 100 && sum > 0) {
      const diff = 100 - sum;
      finalProbHome += diff;
    }

    return {
      probHome: finalProbHome,
      probAway: probAway,
      probDraw: probDraw,
      predictionSummary: data.predictionSummary || 'Partida equilibrada.',
      tips: Array.isArray(data.tips) ? data.tips.map(String) : ['Resultado imprevisível'],
      commentary: data.commentary || 'Análise indisponível no momento.',
    };
  }
}
