import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
export declare class AnalyticsService {
    private readonly prisma;
    private readonly redis;
    constructor(prisma: PrismaService, redis: RedisService);
    getOnlineCount(): Promise<{
        online_count: number;
        online_ips: string[];
    }>;
    getVisitors(page?: number, limit?: number): Promise<{
        visitors: ({
            _count: {
                sessions: number;
            };
        } & {
            ip: string;
            fbp: string | null;
            name: string | null;
            phone: string | null;
            email: string | null;
            id: string;
            userAgent: string | null;
            country: string | null;
            city: string | null;
            hasAdblock: boolean;
            cookieConsent: boolean | null;
            firstSeen: Date;
            lastSeen: Date;
        })[];
        total: number;
        page: number;
        limit: number;
    }>;
    getSessionsByVisitor(visitorId: string, page?: number, limit?: number): Promise<{
        sessions: ({
            _count: {
                events: number;
                requestLogs: number;
                metaLogs: number;
            };
        } & {
            fbclid: string | null;
            referer: string | null;
            environment: string;
            id: string;
            hasAdblock: boolean;
            cookieConsent: boolean | null;
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
    getEventsBySession(sessionId: string, page?: number, limit?: number): Promise<{
        events: {
            url: string | null;
            slug: string | null;
            id: string;
            eventName: string;
            eventId: string | null;
            timestamp: Date;
            customData: import("@prisma/client/runtime/library").JsonValue | null;
            sessionId: string;
        }[];
        total: number;
        page: number;
        limit: number;
    }>;
    getRequestLogsBySession(sessionId: string): Promise<{
        method: string;
        endpoint: string;
        id: string;
        timestamp: Date;
        sessionId: string;
        statusCode: number | null;
        requestBody: import("@prisma/client/runtime/library").JsonValue | null;
        responseBody: import("@prisma/client/runtime/library").JsonValue | null;
        durationMs: number | null;
    }[]>;
    getMetaLogs(filters?: {
        event_name?: string;
        has_adblock?: boolean;
        page?: number;
        limit?: number;
    }): Promise<{
        logs: {
            route: string;
            id: string;
            hasAdblock: boolean;
            cookieConsent: boolean | null;
            eventName: string;
            eventId: string | null;
            timestamp: Date;
            sessionId: string | null;
            pixelId: string | null;
            requestPayload: import("@prisma/client/runtime/library").JsonValue;
            responsePayload: import("@prisma/client/runtime/library").JsonValue | null;
            responseStatus: number | null;
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
    getDashboardStats(): Promise<{
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
    getFunnel(environment?: string): Promise<{
        total_sessions: number;
        funnel: {
            step: string;
            sessions: number;
            percentage: number;
        }[];
    }>;
    getCampaignStats(environment?: string): Promise<{
        utm_source: string | null;
        utm_campaign: string | null;
        utm_medium: string | null;
        sessions: number;
    }[]>;
    searchByIp(ip: string): Promise<({
        sessions: ({
            events: {
                url: string | null;
                slug: string | null;
                id: string;
                eventName: string;
                eventId: string | null;
                timestamp: Date;
                customData: import("@prisma/client/runtime/library").JsonValue | null;
                sessionId: string;
            }[];
            requestLogs: {
                method: string;
                endpoint: string;
                id: string;
                timestamp: Date;
                sessionId: string;
                statusCode: number | null;
                requestBody: import("@prisma/client/runtime/library").JsonValue | null;
                responseBody: import("@prisma/client/runtime/library").JsonValue | null;
                durationMs: number | null;
            }[];
            metaLogs: {
                route: string;
                id: string;
                hasAdblock: boolean;
                cookieConsent: boolean | null;
                eventName: string;
                eventId: string | null;
                timestamp: Date;
                sessionId: string | null;
                pixelId: string | null;
                requestPayload: import("@prisma/client/runtime/library").JsonValue;
                responsePayload: import("@prisma/client/runtime/library").JsonValue | null;
                responseStatus: number | null;
                hasFbp: boolean;
                hasFbc: boolean;
                hasEmail: boolean;
                hasPhone: boolean;
                hasFn: boolean;
                hasLn: boolean;
                clientIp: string | null;
            }[];
        } & {
            fbclid: string | null;
            referer: string | null;
            environment: string;
            id: string;
            hasAdblock: boolean;
            cookieConsent: boolean | null;
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
    } & {
        ip: string;
        fbp: string | null;
        name: string | null;
        phone: string | null;
        email: string | null;
        id: string;
        userAgent: string | null;
        country: string | null;
        city: string | null;
        hasAdblock: boolean;
        cookieConsent: boolean | null;
        firstSeen: Date;
        lastSeen: Date;
    }) | null>;
}
