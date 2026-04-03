import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FixturesService {
  constructor(private readonly prisma: PrismaService) {}

  async findToday() {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    return this.prisma.fixture.findMany({
      where: {
        date: {
          gte: start,
          lte: end,
        },
      },
      include: {
        league: true,
        homeTeam: true,
        awayTeam: true,
      },
      orderBy: { date: 'asc' },
    });
  }

  async findByDate(date: string) {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);

    return this.prisma.fixture.findMany({
      where: {
        date: {
          gte: start,
          lte: end,
        },
      },
      include: {
        league: true,
        homeTeam: true,
        awayTeam: true,
      },
      orderBy: { date: 'asc' },
    });
  }
}
