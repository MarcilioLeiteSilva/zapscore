import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    const redisUrl = this.configService.get<string>('REDIS_URL');
    if (redisUrl) {
      try {
        this.client = new Redis(redisUrl, {
          retryStrategy: (times) => {
            const delay = Math.min(times * 50, 2000);
            return delay;
          },
        });

        this.client.on('connect', () => {
          this.logger.log('Redis connected successfully');
        });

        this.client.on('error', (err) => {
          this.logger.error('Redis connection error', err);
        });
      } catch (error) {
        this.logger.error('Failed to initialize Redis', error);
      }
    } else {
      this.logger.warn('REDIS_URL not found, Redis integration will be disabled');
    }
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.quit();
    }
  }

  getClient(): Redis {
    return this.client;
  }

  async set(key: string, value: string, ttlSeconds?: number) {
    if (!this.client) return;
    if (ttlSeconds) {
      await this.client.set(key, value, 'EX', ttlSeconds);
    } else {
      await this.client.set(key, value);
    }
  }

  async get(key: string): Promise<string | null> {
    if (!this.client) return null;
    return this.client.get(key);
  }

  async del(key: string) {
    if (!this.client) return;
    await this.client.del(key);
  }
}
