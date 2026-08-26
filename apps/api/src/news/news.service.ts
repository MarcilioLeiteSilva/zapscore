import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NewsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: { leagueId?: string; teamId?: string; limit?: string }) {
    const { leagueId, teamId, limit } = params;
    const take = limit ? parseInt(limit) : 100;

    return this.prisma.news.findMany({
      where: {
        ...(leagueId && { leagueId }),
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
      console.log('Tentando criar notícia:', data);
      return await this.prisma.news.create({ data });
    } catch (error) {
      console.error('ERRO AO CRIAR NOTÍCIA NO BANCO:', error);
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
      console.error('ERRO AO ATUALIZAR NOTÍCIA:', error);
      throw error;
    }
  }

  async remove(id: string) {
    try {
      return await this.prisma.news.delete({
        where: { id },
      });
    } catch (error) {
      console.error('ERRO AO DELETAR NOTÍCIA:', error);
      throw error;
    }
  }
}
