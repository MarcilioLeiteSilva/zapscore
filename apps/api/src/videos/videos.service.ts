import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class VideosService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: { leagueId?: string; teamId?: string; limit?: string }) {
    const { leagueId, teamId, limit } = params;
    const take = limit ? parseInt(limit) : 100;

    let leagueFilter: any = undefined;
    if (leagueId) {
      const extId = parseInt(leagueId, 10);
      if (!isNaN(extId) && !leagueId.includes('-')) {
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
    
    return this.prisma.video.findMany({
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
  }

  async findOne(id: string) {
    return this.prisma.video.findUnique({
      where: { id },
      include: {
        league: true,
        team: true,
      },
    });
  }

  async create(data: any) {
    try {
      console.log('Tentando criar vídeo:', data);
      return await this.prisma.video.create({ data });
    } catch (error) {
      console.error('ERRO AO CRIAR VÍDEO NO BANCO:', error);
      throw error;
    }
  }

  async update(id: string, data: any) {
    try {
      return await this.prisma.video.update({
        where: { id },
        data,
      });
    } catch (error) {
      console.error('ERRO AO ATUALIZAR VÍDEO:', error);
      throw error;
    }
  }

  async remove(id: string) {
    try {
      return await this.prisma.video.delete({
        where: { id },
      });
    } catch (error) {
      console.error('ERRO AO DELETAR VÍDEO:', error);
      throw error;
    }
  }
}
