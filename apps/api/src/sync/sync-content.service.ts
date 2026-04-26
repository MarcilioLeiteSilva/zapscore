import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import fetch from 'node-fetch';

@Injectable()
export class SyncContentService implements OnModuleInit {
  private readonly logger = new Logger(SyncContentService.name);

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    this.logger.log('Servidor iniciado. Rodando sincronização inicial...');
    await this.handleCron();
  }

  // Roda a cada 6 horas
  @Cron(CronExpression.EVERY_6_HOURS)
  async handleCron() {
    this.logger.log('Iniciando sincronização automática de conteúdo...');
    await this.syncNews();
    await this.syncVideos();
    this.logger.log('Sincronização finalizada.');
  }

  async syncNews() {
    this.logger.log('Buscando notícias...');
    try {
      // Exemplo: Simulando busca de um portal de esportes
      // Em uma implementação real, usaríamos um parser de RSS ou API de notícias
      const mockNews = [
        {
          title: 'Brasil vence amistoso com gol de estreante',
          description: 'A seleção brasileira mostrou bom desempenho no último teste antes das eliminatórias.',
          source: 'ZapScore News',
          imageUrl: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018',
        },
        {
          title: 'Mercado da bola: Craque europeu na mira do Flamengo',
          description: 'Rumores indicam que o clube carioca iniciou conversas com o staff do jogador.',
          source: 'ZapScore News',
          imageUrl: 'https://images.unsplash.com/photo-1517927033932-b3d18e61fb3a',
        }
      ];

      for (const item of mockNews) {
        const exists = await this.prisma.news.findFirst({ where: { title: item.title } });
        if (!exists) {
          await this.prisma.news.create({ data: item });
          this.logger.log(`Nova notícia inserida: ${item.title}`);
        }
      }
    } catch (error) {
      this.logger.error('Erro ao sincronizar notícias', error);
    }
  }

  async syncVideos() {
    this.logger.log('Buscando vídeos/highlights...');
    try {
      const mockVideos = [
        {
          title: 'Highlights: Real Madrid vs Barcelona',
          videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', // Exemplo
          thumbnailUrl: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20',
          duration: '10:15',
        }
      ];

      for (const item of mockVideos) {
        const exists = await this.prisma.video.findFirst({ where: { title: item.title } });
        if (!exists) {
          await this.prisma.video.create({ data: item });
          this.logger.log(`Novo vídeo inserido: ${item.title}`);
        }
      }
    } catch (error) {
      this.logger.error('Erro ao sincronizar vídeos', error);
    }
  }
}
