import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const CONFIG_KEY = 'global';

@Injectable()
export class ConfigService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get or create the global config record.
   */
  private async getOrCreateConfig() {
    try {
      let config = await this.prisma.appConfig.findUnique({
        where: { key: CONFIG_KEY },
      });

      if (!config) {
        config = await this.prisma.appConfig.create({
          data: { key: CONFIG_KEY, trackingEnabled: true },
        });
      }

      return config;
    } catch (error) {
      // If the collection doesn't exist yet or any DB error, return a safe default
      return { key: CONFIG_KEY, trackingEnabled: true };
    }
  }

  async getTrackingStatus() {
    const config = await this.getOrCreateConfig();
    return { tracking_enabled: config.trackingEnabled };
  }

  async setTracking(enabled?: boolean) {
    const config = await this.getOrCreateConfig();
    const newValue = enabled !== undefined ? enabled : !config.trackingEnabled;

    try {
      const updated = await this.prisma.appConfig.update({
        where: { key: CONFIG_KEY },
        data: { trackingEnabled: newValue },
      });
      return { tracking_enabled: updated.trackingEnabled };
    } catch {
      // If update fails (e.g. record doesn't exist yet), try create
      const created = await this.prisma.appConfig.create({
        data: { key: CONFIG_KEY, trackingEnabled: newValue },
      });
      return { tracking_enabled: created.trackingEnabled };
    }
  }
}
