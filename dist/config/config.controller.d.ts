import { ConfigService } from './config.service';
export declare class ConfigController {
    private readonly configService;
    constructor(configService: ConfigService);
    getTrackingStatus(): Promise<{
        tracking_enabled: boolean;
    }>;
    toggleTracking(body: {
        tracking_enabled?: boolean;
    }): Promise<{
        tracking_enabled: boolean;
    }>;
}
