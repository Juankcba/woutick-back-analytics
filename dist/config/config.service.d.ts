import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
export declare class ConfigService {
    private readonly prisma;
    private readonly redis;
    constructor(prisma: PrismaService, redis: RedisService);
    private syncTrackingToRedis;
    getTrackingStatus(): Promise<{
        tracking_enabled: boolean;
    }>;
    setTracking(enabled?: boolean): Promise<{
        tracking_enabled: boolean;
    }>;
}
