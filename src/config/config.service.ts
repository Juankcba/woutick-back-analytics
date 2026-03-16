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
    let config = await this.prisma.appConfig.findUnique({
      where: { key: CONFIG_KEY },
    });

    if (!config) {
      config = await this.prisma.appConfig.create({
        data: { key: CONFIG_KEY, trackingEnabled: true },
      });
    }

    return config;
  }

  async getTrackingStatus() {
    const config = await this.getOrCreateConfig();
    return { tracking_enabled: config.trackingEnabled };
  }

  async toggleTracking() {
    const config = await this.getOrCreateConfig();
    const updated = await this.prisma.appConfig.update({
      where: { key: CONFIG_KEY },
      data: { trackingEnabled: !config.trackingEnabled },
    });

    return { tracking_enabled: updated.trackingEnabled };
  }
}
