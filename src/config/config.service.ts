import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const CONFIG_KEY = 'global';

@Injectable()
export class ConfigService {
  constructor(private readonly prisma: PrismaService) {}

  async getTrackingStatus() {
    try {
      const config = await this.prisma.appConfig.findUnique({
        where: { key: CONFIG_KEY },
      });
      return { tracking_enabled: config?.trackingEnabled ?? true };
    } catch {
      return { tracking_enabled: true };
    }
  }

  async setTracking(enabled?: boolean) {
    try {
      // Try to find existing config
      const existing = await this.prisma.appConfig.findUnique({
        where: { key: CONFIG_KEY },
      });

      if (existing) {
        // Record exists — update it
        const newValue = enabled !== undefined ? enabled : !existing.trackingEnabled;
        const updated = await this.prisma.appConfig.update({
          where: { key: CONFIG_KEY },
          data: { trackingEnabled: newValue },
        });
        return { tracking_enabled: updated.trackingEnabled };
      } else {
        // No record — create it
        const newValue = enabled !== undefined ? enabled : false;
        const created = await this.prisma.appConfig.create({
          data: { key: CONFIG_KEY, trackingEnabled: newValue },
        });
        return { tracking_enabled: created.trackingEnabled };
      }
    } catch (error) {
      // Last resort: try create
      try {
        const newValue = enabled !== undefined ? enabled : true;
        const created = await this.prisma.appConfig.create({
          data: { key: CONFIG_KEY, trackingEnabled: newValue },
        });
        return { tracking_enabled: created.trackingEnabled };
      } catch {
        return { tracking_enabled: enabled ?? true };
      }
    }
  }
}
