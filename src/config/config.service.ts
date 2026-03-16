import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

const CONFIG_KEY = 'global';
const REDIS_TRACKING_KEY = 'tracking_enabled';

@Injectable()
export class ConfigService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {
    // On startup, load tracking status from Mongo into Redis
    this.syncTrackingToRedis().catch(() => {});
  }

  /**
   * Sync Mongo → Redis on startup
   */
  private async syncTrackingToRedis() {
    try {
      const config = await this.prisma.appConfig.findUnique({
        where: { key: CONFIG_KEY },
      });
      const value = config?.trackingEnabled ?? true;
      await this.redis.set(REDIS_TRACKING_KEY, value ? '1' : '0');
    } catch {
      // If Mongo fails, default to enabled
    }
  }

  /**
   * Get tracking status — reads from Redis first (fast),
   * falls back to Mongo.
   */
  async getTrackingStatus() {
    // 1. Try Redis (fast path)
    try {
      const cached = await this.redis.get(REDIS_TRACKING_KEY);
      if (cached !== null) {
        return { tracking_enabled: cached === '1' };
      }
    } catch {}

    // 2. Fallback to Mongo
    try {
      const config = await this.prisma.appConfig.findUnique({
        where: { key: CONFIG_KEY },
      });
      const value = config?.trackingEnabled ?? true;
      // Write back to Redis for next time
      await this.redis.set(REDIS_TRACKING_KEY, value ? '1' : '0').catch(() => {});
      return { tracking_enabled: value };
    } catch {
      return { tracking_enabled: true };
    }
  }

  /**
   * Toggle or set tracking status.
   * Writes to both Redis (instant) and Mongo (persistent).
   */
  async setTracking(enabled?: boolean) {
    try {
      // Determine current value if toggling
      let newValue: boolean;
      if (enabled !== undefined) {
        newValue = enabled;
      } else {
        // Toggle: read current, flip it
        const current = await this.getTrackingStatus();
        newValue = !current.tracking_enabled;
      }

      console.log(`[Config] setTracking: setting to ${newValue}`);

      // 1. Write to Redis immediately (fast for frontend)
      try {
        await this.redis.set(REDIS_TRACKING_KEY, newValue ? '1' : '0');
        console.log(`[Config] Redis updated: ${REDIS_TRACKING_KEY} = ${newValue ? '1' : '0'}`);
      } catch (e) {
        console.error('[Config] Redis write failed:', e);
      }

      // 2. Persist to Mongo (upsert to avoid find+update race)
      try {
        const existing = await this.prisma.appConfig.findUnique({
          where: { key: CONFIG_KEY },
        });

        if (existing) {
          await this.prisma.appConfig.update({
            where: { key: CONFIG_KEY },
            data: { trackingEnabled: newValue },
          });
        } else {
          await this.prisma.appConfig.create({
            data: { key: CONFIG_KEY, trackingEnabled: newValue },
          });
        }
        console.log(`[Config] Mongo updated: trackingEnabled = ${newValue}`);
      } catch (e) {
        console.error('[Config] Mongo write failed:', e);
      }

      return { tracking_enabled: newValue };
    } catch (e) {
      console.error('[Config] setTracking error:', e);
      return { tracking_enabled: enabled ?? true };
    }
  }
}
