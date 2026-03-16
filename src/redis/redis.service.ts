import { Injectable, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

const ONLINE_TTL_SECONDS = 300; // 5 minutes
const ONLINE_SET_KEY = 'online_users';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly client: Redis;

  constructor() {
    this.client = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
  }

  async onModuleDestroy() {
    await this.client.quit();
  }

  /**
   * Mark a visitor (by IP) as online.
   * Uses a sorted set with score = current timestamp.
   */
  async markOnline(ip: string): Promise<void> {
    const now = Date.now();
    await this.client.zadd(ONLINE_SET_KEY, now, ip);
  }

  /**
   * Get count of online users (active in last 5 minutes).
   */
  async getOnlineCount(): Promise<number> {
    const cutoff = Date.now() - ONLINE_TTL_SECONDS * 1000;
    // Remove stale entries
    await this.client.zremrangebyscore(ONLINE_SET_KEY, '-inf', cutoff);
    return this.client.zcard(ONLINE_SET_KEY);
  }

  /**
   * Get list of online IPs (active in last 5 minutes).
   */
  async getOnlineUsers(): Promise<string[]> {
    const cutoff = Date.now() - ONLINE_TTL_SECONDS * 1000;
    await this.client.zremrangebyscore(ONLINE_SET_KEY, '-inf', cutoff);
    return this.client.zrangebyscore(ONLINE_SET_KEY, cutoff, '+inf');
  }
}
