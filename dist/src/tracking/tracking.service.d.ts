import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { TrackEventDto, TrackRequestLogDto, TrackMetaLogDto, HeartbeatDto } from './tracking.dto';
export declare class TrackingService {
    private readonly prisma;
    private readonly redis;
    private readonly logger;
    constructor(prisma: PrismaService, redis: RedisService);
    private getOrCreateVisitorAndSession;
    heartbeat(dto: HeartbeatDto): Promise<{
        visitor_id: string;
        session_id: string;
    }>;
    trackEvent(dto: TrackEventDto): Promise<{
        event_id: string;
        session_id: string;
    }>;
    trackRequestLog(dto: TrackRequestLogDto): Promise<{
        log_id: string;
    }>;
    trackMetaLog(dto: TrackMetaLogDto): Promise<{
        log_id: string;
    }>;
}
