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
             const delay = Math.min(times * 100, 3000);
             return delay;
          },
        });

        this.client.on('connect', () => this.logger.log('Redis initialized and connected.'));
        this.client.on('error', (err) => this.logger.error('Redis error:', err.message));
      } catch (error) {
        this.logger.error('Failed to initialize Redis client', error);
      }
    } else {
      this.logger.warn('REDIS_URL is missing. Cache layer will be bypassed.');
    }
  }

  async onModuleDestroy() {
    if (this.client) await this.client.quit();
  }

  // Chaveamento Escalável
  generateKey(prefix: string, context: { leagueId?: number; season?: number; [key: string]: any }): string {
    const { leagueId = 'any', season = 'any', ...rest } = context;
    const parts = [prefix, leagueId, season];
    Object.entries(rest).forEach(([key, val]) => {
        if (val !== undefined) parts.push(`${key}=${val}`);
    });
    return parts.join(':');
  }

  async getJson<T>(key: string): Promise<T | null> {
    if (!this.client) return null;
    const data = await this.client.get(key);
    return data ? JSON.parse(data) : null;
  }

  async setJson(key: string, value: any, ttlSeconds: number = 3600): Promise<void> {
    if (!this.client) return;
    await this.client.set(key, JSON.stringify(value), 'EX', ttlSeconds);
    this.logger.debug(`Cache SET: ${key} (TTL: ${ttlSeconds}s)`);
  }

  async delPattern(pattern: string): Promise<void> {
    if (!this.client) return;
    const keys = await this.client.keys(pattern);
    if (keys.length > 0) {
      await this.client.del(...keys);
      this.logger.debug(`Cache DEL PATTERN: ${pattern} (${keys.length} keys)`);
    }
  }

  async flushAll(): Promise<void> {
    if (this.client) await this.client.flushall();
  }
}
