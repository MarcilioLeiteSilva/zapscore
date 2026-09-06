import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class Crawl4aiClient {
  private readonly logger = new Logger(Crawl4aiClient.name);

  private readonly baseUrl: string;
  private readonly token: string;

  constructor(private readonly configService: ConfigService) {
    this.baseUrl =
      this.configService.get<string>('CRAWL4AI_URL') ||
      'https://zapscore-crwal4ai.gtalg3.easypanel.host';
    this.token =
      this.configService.get<string>('CRAWL4AI_API_TOKEN') ||
      '4084320bd0f74f01167b0067afeb4c42dbc1139e416779a9397ee38271dbc95e';
  }

  /**
   * Executa extração síncrona de uma URL retornando Markdown limpo
   */
  async crawlSync(url: string, timeoutMs = 8000): Promise<string | null> {
    if (!url || !url.startsWith('http')) {
      return null;
    }

    try {
      const response = await axios.post(
        `${this.baseUrl}/crawl_sync`,
        {
          urls: url,
          priority: 10,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.token}`,
          },
          timeout: timeoutMs,
        },
      );

      const result = response.data?.result;
      if (result?.markdown) {
        this.logger.log(
          `[Crawl4AI] ✅ Extração com sucesso de ${url} (${result.markdown.length} caracteres)`,
        );
        return result.markdown;
      }

      if (Array.isArray(response.data?.results) && response.data.results[0]?.markdown) {
        return response.data.results[0].markdown;
      }

      return null;
    } catch (err: any) {
      this.logger.warn(
        `[Crawl4AI] Falha na extração de ${url}: ${err.message} (Fallback ativado)`,
      );
      return null;
    }
  }

  /**
   * Healthcheck do microserviço Crawl4AI
   */
  async checkHealth(): Promise<{ status: string; memory_usage?: number; cpu_usage?: number } | null> {
    try {
      const response = await axios.get(`${this.baseUrl}/health`, { timeout: 3000 });
      return response.data;
    } catch (err: any) {
      this.logger.warn(`[Crawl4AI] Healthcheck falhou: ${err.message}`);
      return null;
    }
  }
}
