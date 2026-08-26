import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class VideosService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: { leagueId?: string; teamId?: string; limit?: string }) {
    const { leagueId, teamId, limit } = params;
    const take = limit ? parseInt(limit) : 100;
    
    let targetLeagueId = leagueId;
    let targetTeamIds: string[] = [];

    if (leagueId) {
      const numericId = parseInt(leagueId, 10);
      if (!isNaN(numericId) && !leagueId.includes('-')) {
        const foundLeague = await this.prisma.league.findFirst({
          where: { externalId: numericId }
        });
        if (foundLeague) {
          targetLeagueId = foundLeague.id;
        }
      }

      if (targetLeagueId) {
        const teamsInLeague = await this.prisma.team.findMany({
          where: {
            OR: [
              { homeFixtures: { some: { leagueId: targetLeagueId } } },
              { awayFixtures: { some: { leagueId: targetLeagueId } } },
            ]
          },
          select: { id: true }
        });
        targetTeamIds = teamsInLeague.map(t => t.id);
      }
    }

    const orConditions: any[] = [];
    if (targetLeagueId) {
      orConditions.push({ leagueId: targetLeagueId });
    }
    if (targetTeamIds.length > 0) {
      orConditions.push({ teamId: { in: targetTeamIds } });
    }
    if (teamId) {
      orConditions.push({ teamId });
    }

    return this.prisma.video.findMany({
      where: orConditions.length > 0 ? { OR: orConditions } : {},
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
