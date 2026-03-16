"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var TrackingService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TrackingService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const redis_service_1 = require("../redis/redis.service");
const SESSION_TIMEOUT_MS = 30 * 60 * 1000;
let TrackingService = TrackingService_1 = class TrackingService {
    prisma;
    redis;
    logger = new common_1.Logger(TrackingService_1.name);
    constructor(prisma, redis) {
        this.prisma = prisma;
        this.redis = redis;
    }
    async getOrCreateVisitorAndSession(ip, options) {
        const visitor = await this.prisma.visitor.upsert({
            where: { ip },
            update: {
                lastSeen: new Date(),
                ...(options?.userAgent && { userAgent: options.userAgent }),
                ...(options?.hasAdblock !== undefined && { hasAdblock: options.hasAdblock }),
                ...(options?.fbp && { fbp: options.fbp }),
            },
            create: {
                ip,
                userAgent: options?.userAgent,
                hasAdblock: options?.hasAdblock ?? false,
                fbp: options?.fbp,
            },
        });
        const cutoff = new Date(Date.now() - SESSION_TIMEOUT_MS);
        let session = await this.prisma.session.findFirst({
            where: {
                visitorId: visitor.id,
                lastActivity: { gte: cutoff },
            },
            orderBy: { lastActivity: 'desc' },
        });
        if (!session) {
            session = await this.prisma.session.create({
                data: {
                    visitorId: visitor.id,
                    landingUrl: options?.landingUrl,
                    utmSource: options?.utmSource,
                    utmMedium: options?.utmMedium,
                    utmCampaign: options?.utmCampaign,
                    utmContent: options?.utmContent,
                    fbclid: options?.fbclid,
                    referer: options?.referer,
                    eventSlug: options?.eventSlug,
                    hasAdblock: options?.hasAdblock ?? false,
                },
            });
        }
        else {
            await this.prisma.session.update({
                where: { id: session.id },
                data: { lastActivity: new Date() },
            });
        }
        return { visitor, session };
    }
    async heartbeat(dto) {
        await this.redis.markOnline(dto.ip);
        const { visitor, session } = await this.getOrCreateVisitorAndSession(dto.ip, {
            userAgent: dto.user_agent,
            hasAdblock: dto.has_adblock,
            fbp: dto.fbp,
            landingUrl: dto.url,
        });
        return { visitor_id: visitor.id, session_id: session.id };
    }
    async trackEvent(dto) {
        await this.redis.markOnline(dto.ip);
        const { session } = await this.getOrCreateVisitorAndSession(dto.ip, {
            userAgent: dto.user_agent,
            hasAdblock: dto.has_adblock,
            fbp: dto.fbp,
            utmSource: dto.utm_source,
            utmMedium: dto.utm_medium,
            utmCampaign: dto.utm_campaign,
            utmContent: dto.utm_content,
            fbclid: dto.fbclid,
            referer: dto.referer,
            eventSlug: dto.event_slug,
            landingUrl: dto.url,
        });
        const event = await this.prisma.event.create({
            data: {
                sessionId: session.id,
                eventName: dto.event_name,
                eventId: dto.event_id,
                url: dto.url,
                slug: dto.slug,
                customData: dto.custom_data ?? undefined,
            },
        });
        return { event_id: event.id, session_id: session.id };
    }
    async trackRequestLog(dto) {
        const { session } = await this.getOrCreateVisitorAndSession(dto.ip);
        const log = await this.prisma.requestLog.create({
            data: {
                sessionId: session.id,
                method: dto.method,
                endpoint: dto.endpoint,
                statusCode: dto.status_code,
                requestBody: dto.request_body ?? undefined,
                responseBody: dto.response_body ?? undefined,
                durationMs: dto.duration_ms,
            },
        });
        return { log_id: log.id };
    }
    async trackMetaLog(dto) {
        let sessionId;
        if (dto.ip) {
            const { session } = await this.getOrCreateVisitorAndSession(dto.ip);
            sessionId = session.id;
        }
        const log = await this.prisma.metaLog.create({
            data: {
                sessionId: sessionId,
                eventName: dto.event_name,
                eventId: dto.event_id,
                pixelId: dto.pixel_id,
                route: dto.route,
                requestPayload: dto.request_payload,
                responsePayload: dto.response_payload ?? undefined,
                hasFbp: dto.has_fbp ?? false,
                hasFbc: dto.has_fbc ?? false,
                hasEmail: dto.has_email ?? false,
                hasPhone: dto.has_phone ?? false,
                hasFn: dto.has_fn ?? false,
                hasLn: dto.has_ln ?? false,
                clientIp: dto.client_ip,
                hasAdblock: dto.has_adblock ?? false,
            },
        });
        return { log_id: log.id };
    }
};
exports.TrackingService = TrackingService;
exports.TrackingService = TrackingService = TrackingService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        redis_service_1.RedisService])
], TrackingService);
//# sourceMappingURL=tracking.service.js.map