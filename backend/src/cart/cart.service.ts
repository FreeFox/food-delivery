import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';
import * as dotenv from 'dotenv';

dotenv.config();

@Injectable()
export class CartService implements OnModuleInit, OnModuleDestroy {
  private redis: Redis;

  onModuleInit() {
    this.redis = new Redis({ host: process.env.REDIS_HOST || 'localhost', port: Number(process.env.REDIS_PORT) || 6379 });
  }

  onModuleDestroy() {
    this.redis.disconnect();
  }

  private key(userId: string) {
    return `cart:${userId}`;
  }

  async getCart(userId: string) {
    const raw = await this.redis.get(this.key(userId));
    return raw ? JSON.parse(raw) : { items: [] };
  }

  async setCart(userId: string, cart: any) {
    await this.redis.set(this.key(userId), JSON.stringify(cart), 'EX', 60 * 60 * 24 * 30);
  }

  async clearCart(userId: string) {
    await this.redis.del(this.key(userId));
  }
}
