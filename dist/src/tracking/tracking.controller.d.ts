import { TrackingService } from './tracking.service';
import { TrackEventDto, TrackRequestLogDto, TrackMetaLogDto, HeartbeatDto } from './tracking.dto';
export declare class TrackingController {
    private readonly trackingService;
    constructor(trackingService: TrackingService);
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
