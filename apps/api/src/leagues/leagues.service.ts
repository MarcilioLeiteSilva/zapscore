import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LeaguesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.league.findMany({
        orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    return this.prisma.league.findUnique({
      where: { id },
    });
  }
}
