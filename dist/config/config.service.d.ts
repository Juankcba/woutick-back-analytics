import { PrismaService } from '../prisma/prisma.service';
export declare class ConfigService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private getOrCreateConfig;
    getTrackingStatus(): Promise<{
        tracking_enabled: boolean;
    }>;
    setTracking(enabled?: boolean): Promise<{
        tracking_enabled: boolean;
    }>;
}
