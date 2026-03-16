import type { Request } from 'express';
import { TrackingService } from './tracking.service';
import { TrackEventDto, TrackRequestLogDto, TrackMetaLogDto, HeartbeatDto } from './tracking.dto';
export declare class TrackingController {
    private readonly trackingService;
    constructor(trackingService: TrackingService);
    heartbeat(dto: HeartbeatDto, req: Request): Promise<{
        visitor_id: string;
        session_id: string;
    }>;
    trackEvent(dto: TrackEventDto, req: Request): Promise<{
        event_id: string;
        session_id: string;
    }>;
    trackRequestLog(dto: TrackRequestLogDto, req: Request): Promise<{
        log_id: string;
    }>;
    trackMetaLog(dto: TrackMetaLogDto, req: Request): Promise<{
        log_id: string;
    }>;
}
