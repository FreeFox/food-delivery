import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, RedisClientType } from 'redis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: RedisClientType;

  constructor(private config: ConfigService) {
    this.client = createClient({
      socket: {
        host: this.config.get('REDIS_HOST') || 'localhost',
        port: this.config.get('REDIS_PORT') || 6379,
      },
    });

    this.client.on('error', (err) => console.log('Redis error:', err));
    this.client.on('connect', () => console.log('Connected to Redis'));
  }

  async onModuleInit() {
    await this.client.connect().catch(console.error);
  }

  async onModuleDestroy() {
    await this.client.quit();
  }

  getClient(): RedisClientType {
    return this.client;
  }

  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async setEx(key: string, seconds: number, value: string): Promise<void> {
    await this.client.setEx(key, seconds, value);
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }
}
