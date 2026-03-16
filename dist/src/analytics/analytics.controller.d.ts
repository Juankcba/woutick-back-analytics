import { AnalyticsService } from './analytics.service';
export declare class AnalyticsController {
    private readonly analyticsService;
    constructor(analyticsService: AnalyticsService);
    getDashboard(): Promise<{
        online: {
            online_count: number;
            online_ips: string[];
        };
        totals: {
            visitors: number;
            sessions: number;
            events: number;
            meta_logs: number;
        };
        adblock: {
            visitors: {
                total: number;
                with_adblock: number;
                percentage: number;
            };
            sessions: {
                total: number;
                with_adblock: number;
                percentage: number;
            };
        };
    }>;
    getOnlineCount(): Promise<{
        online_count: number;
        online_ips: string[];
    }>;
    getVisitors(page?: string, limit?: string): Promise<{
        visitors: ({
            _count: {
                sessions: number;
            };
        } & {
            ip: string;
            fbp: string | null;
            id: string;
            userAgent: string | null;
            country: string | null;
            city: string | null;
            hasAdblock: boolean;
            firstSeen: Date;
            lastSeen: Date;
        })[];
        total: number;
        page: number;
        limit: number;
    }>;
    getSessions(visitorId: string, page?: string, limit?: string): Promise<{
        sessions: ({
            _count: {
                events: number;
                requestLogs: number;
                metaLogs: number;
            };
        } & {
            fbclid: string | null;
            referer: string | null;
            id: string;
            hasAdblock: boolean;
            visitorId: string;
            startedAt: Date;
            lastActivity: Date;
            landingUrl: string | null;
            utmSource: string | null;
            utmMedium: string | null;
            utmCampaign: string | null;
            utmContent: string | null;
            eventSlug: string | null;
        })[];
        total: number;
        page: number;
        limit: number;
    }>;
    getEvents(sessionId: string, page?: string, limit?: string): Promise<{
        events: {
            url: string | null;
            slug: string | null;
            id: string;
            eventName: string;
            eventId: string | null;
            timestamp: Date;
            customData: import("@prisma/client/runtime/client").JsonValue | null;
            sessionId: string;
        }[];
        total: number;
        page: number;
        limit: number;
    }>;
    getRequestLogs(sessionId: string): Promise<{
        method: string;
        endpoint: string;
        id: string;
        timestamp: Date;
        sessionId: string;
        statusCode: number | null;
        requestBody: import("@prisma/client/runtime/client").JsonValue | null;
        responseBody: import("@prisma/client/runtime/client").JsonValue | null;
        durationMs: number | null;
    }[]>;
    getMetaLogs(eventName?: string, hasAdblock?: string, page?: string, limit?: string): Promise<{
        logs: {
            route: string;
            id: string;
            hasAdblock: boolean;
            eventName: string;
            eventId: string | null;
            timestamp: Date;
            sessionId: string | null;
            pixelId: string | null;
            requestPayload: import("@prisma/client/runtime/client").JsonValue;
            responsePayload: import("@prisma/client/runtime/client").JsonValue | null;
            hasFbp: boolean;
            hasFbc: boolean;
            hasEmail: boolean;
            hasPhone: boolean;
            hasFn: boolean;
            hasLn: boolean;
            clientIp: string | null;
        }[];
        total: number;
        page: number;
        limit: number;
    }>;
    getAdblockStats(): Promise<{
        visitors: {
            total: number;
            with_adblock: number;
            percentage: number;
        };
        sessions: {
            total: number;
            with_adblock: number;
            percentage: number;
        };
    }>;
}
