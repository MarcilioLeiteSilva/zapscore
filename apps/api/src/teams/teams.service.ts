import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TeamsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.team.findMany({
        orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    return this.prisma.team.findUnique({
      where: { id },
    });
  }
}
