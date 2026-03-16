import { Injectable, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

const ONLINE_TTL_SECONDS = 300; // 5 minutes
const ONLINE_SET_KEY = 'online_users';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private client: Redis | null = null;

  constructor() {
    try {
      const url = process.env.REDIS_URL;
      if (url) {
        this.client = new Redis(url, { lazyConnect: true, connectTimeout: 5000 });
        this.client.connect().catch(() => {
          console.warn('⚠️ Redis connection failed, disabling Redis features');
          this.client = null;
        });
      } else {
        console.warn('⚠️ REDIS_URL not set, Redis features disabled');
      }
    } catch {
      console.warn('⚠️ Redis init error, Redis features disabled');
    }
  }

  async onModuleDestroy() {
    await this.client?.quit();
  }

  async markOnline(ip: string): Promise<void> {
    if (!this.client) return;
    try {
      const now = Date.now();
      await this.client.zadd(ONLINE_SET_KEY, now, ip);
    } catch { /* Redis unavailable */ }
  }

  async getOnlineCount(): Promise<number> {
    if (!this.client) return 0;
    try {
      const cutoff = Date.now() - ONLINE_TTL_SECONDS * 1000;
      await this.client.zremrangebyscore(ONLINE_SET_KEY, '-inf', cutoff);
      return this.client.zcard(ONLINE_SET_KEY);
    } catch {
      return 0;
    }
  }

  async getOnlineUsers(): Promise<string[]> {
    if (!this.client) return [];
    try {
      const cutoff = Date.now() - ONLINE_TTL_SECONDS * 1000;
      await this.client.zremrangebyscore(ONLINE_SET_KEY, '-inf', cutoff);
      return this.client.zrangebyscore(ONLINE_SET_KEY, cutoff, '+inf');
    } catch {
      return [];
    }
  }
}

