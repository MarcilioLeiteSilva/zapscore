import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor(private configService: ConfigService) {
    const databaseUrl = configService.get<string>('DATABASE_URL');
    if (!databaseUrl) {
      throw new Error('DATABASE_URL is not defined in environment variables');
    }
    
    // Explicitly providing the database URL for the 'db' datasource defined in schema.prisma.
    // We use 'as any' to bypass strict TS check (TS2353) which can cause build-time failures
    // while ensuring the Prisma Engine correctly connects at runtime.
    super({
      datasources: {
        db: {
          url: databaseUrl,
        },
      },
    } as any);
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
