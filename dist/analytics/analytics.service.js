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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const redis_service_1 = require("../redis/redis.service");
let AnalyticsService = class AnalyticsService {
    prisma;
    redis;
    constructor(prisma, redis) {
        this.prisma = prisma;
        this.redis = redis;
    }
    async getOnlineCount() {
        try {
            const count = await this.redis.getOnlineCount();
            const users = await this.redis.getOnlineUsers();
            return { online_count: count, online_ips: users };
        }
        catch {
            return { online_count: 0, online_ips: [] };
        }
    }
    async getVisitors(page = 1, limit = 50) {
        try {
            const skip = (page - 1) * limit;
            const [visitors, total] = await Promise.all([
                this.prisma.visitor.findMany({
                    orderBy: { lastSeen: 'desc' },
                    skip,
                    take: limit,
                    include: { _count: { select: { sessions: true } } },
                }),
                this.prisma.visitor.count(),
            ]);
            return { visitors, total, page, limit };
        }
        catch {
            return { visitors: [], total: 0, page, limit };
        }
    }
    async getSessionsByVisitor(visitorId, page = 1, limit = 20) {
        try {
            const skip = (page - 1) * limit;
            const [sessions, total] = await Promise.all([
                this.prisma.session.findMany({
                    where: { visitorId },
                    orderBy: { startedAt: 'desc' },
                    skip,
                    take: limit,
                    include: { _count: { select: { events: true, requestLogs: true, metaLogs: true } } },
                }),
                this.prisma.session.count({ where: { visitorId } }),
            ]);
            return { sessions, total, page, limit };
        }
        catch {
            return { sessions: [], total: 0, page, limit };
        }
    }
    async getEventsBySession(sessionId, page = 1, limit = 100) {
        try {
            const skip = (page - 1) * limit;
            const [events, total] = await Promise.all([
                this.prisma.event.findMany({
                    where: { sessionId },
                    orderBy: { timestamp: 'asc' },
                    skip,
                    take: limit,
                }),
                this.prisma.event.count({ where: { sessionId } }),
            ]);
            return { events, total, page, limit };
        }
        catch {
            return { events: [], total: 0, page, limit };
        }
    }
    async getRequestLogsBySession(sessionId) {
        try {
            return await this.prisma.requestLog.findMany({
                where: { sessionId },
                orderBy: { timestamp: 'asc' },
            });
        }
        catch {
            return [];
        }
    }
    async getMetaLogs(filters) {
        const page = filters?.page || 1;
        const limit = filters?.limit || 50;
        try {
            const skip = (page - 1) * limit;
            const where = {};
            if (filters?.event_name)
                where.eventName = filters.event_name;
            if (filters?.has_adblock !== undefined)
                where.hasAdblock = filters.has_adblock;
            const [logs, total] = await Promise.all([
                this.prisma.metaLog.findMany({
                    where,
                    orderBy: { timestamp: 'desc' },
                    skip,
                    take: limit,
                }),
                this.prisma.metaLog.count({ where }),
            ]);
            return { logs, total, page, limit };
        }
        catch {
            return { logs: [], total: 0, page, limit };
        }
    }
    async getAdblockStats() {
        try {
            const [totalVisitors, adblockVisitors, totalSessions, adblockSessions] = await Promise.all([
                this.prisma.visitor.count(),
                this.prisma.visitor.count({ where: { hasAdblock: true } }),
                this.prisma.session.count(),
                this.prisma.session.count({ where: { hasAdblock: true } }),
            ]);
            return {
                visitors: {
                    total: totalVisitors,
                    with_adblock: adblockVisitors,
                    percentage: totalVisitors > 0
                        ? Math.round((adblockVisitors / totalVisitors) * 100 * 10) / 10
                        : 0,
                },
                sessions: {
                    total: totalSessions,
                    with_adblock: adblockSessions,
                    percentage: totalSessions > 0
                        ? Math.round((adblockSessions / totalSessions) * 100 * 10) / 10
                        : 0,
                },
            };
        }
        catch {
            return {
                visitors: { total: 0, with_adblock: 0, percentage: 0 },
                sessions: { total: 0, with_adblock: 0, percentage: 0 },
            };
        }
    }
    async getDashboardStats() {
        const onlineData = await this.getOnlineCount();
        let totals = { visitors: 0, sessions: 0, events: 0, meta_logs: 0 };
        try {
            const [totalVisitors, totalSessions, totalEvents, totalMetaLogs] = await Promise.all([
                this.prisma.visitor.count(),
                this.prisma.session.count(),
                this.prisma.event.count(),
                this.prisma.metaLog.count(),
            ]);
            totals = { visitors: totalVisitors, sessions: totalSessions, events: totalEvents, meta_logs: totalMetaLogs };
        }
        catch { }
        const adblock = await this.getAdblockStats();
        return { online: onlineData, totals, adblock };
    }
    async getFunnel(environment) {
        try {
            const envFilter = environment ? { session: { environment } } : {};
            const sessionEnvFilter = environment ? { environment } : {};
            const [pageViews, addToCarts, checkouts, purchases] = await Promise.all([
                this.prisma.event.groupBy({
                    by: ['sessionId'],
                    where: { eventName: 'PageView', ...envFilter },
                }),
                this.prisma.event.groupBy({
                    by: ['sessionId'],
                    where: { eventName: 'AddToCart', ...envFilter },
                }),
                this.prisma.event.groupBy({
                    by: ['sessionId'],
                    where: { eventName: 'InitiateCheckout', ...envFilter },
                }),
                this.prisma.event.groupBy({
                    by: ['sessionId'],
                    where: { eventName: { in: ['Purchase', 'PurchaseConfirm'] }, ...envFilter },
                }),
            ]);
            const totalSessions = await this.prisma.session.count({ where: sessionEnvFilter });
            return {
                total_sessions: totalSessions,
                funnel: [
                    { step: 'PageView', sessions: pageViews.length, percentage: totalSessions > 0 ? Math.round((pageViews.length / totalSessions) * 100 * 10) / 10 : 0 },
                    { step: 'AddToCart', sessions: addToCarts.length, percentage: pageViews.length > 0 ? Math.round((addToCarts.length / pageViews.length) * 100 * 10) / 10 : 0 },
                    { step: 'InitiateCheckout', sessions: checkouts.length, percentage: addToCarts.length > 0 ? Math.round((checkouts.length / addToCarts.length) * 100 * 10) / 10 : 0 },
                    { step: 'Purchase', sessions: purchases.length, percentage: checkouts.length > 0 ? Math.round((purchases.length / checkouts.length) * 100 * 10) / 10 : 0 },
                ],
            };
        }
        catch {
            return { total_sessions: 0, funnel: [] };
        }
    }
    async getCampaignStats(environment) {
        try {
            const envFilter = environment ? { environment } : {};
            const campaigns = await this.prisma.session.groupBy({
                by: ['utmSource', 'utmCampaign', 'utmMedium'],
                where: {
                    utmSource: { not: null },
                    ...envFilter,
                },
                _count: { id: true },
                orderBy: { _count: { id: 'desc' } },
                take: 50,
            });
            return campaigns.map((c) => ({
                utm_source: c.utmSource,
                utm_campaign: c.utmCampaign,
                utm_medium: c.utmMedium,
                sessions: c._count.id,
            }));
        }
        catch {
            return [];
        }
    }
    async searchByIp(ip) {
        try {
            const visitor = await this.prisma.visitor.findFirst({
                where: { ip: { contains: ip } },
                include: {
                    sessions: {
                        orderBy: { startedAt: 'desc' },
                        take: 20,
                        include: {
                            events: { orderBy: { timestamp: 'asc' } },
                            requestLogs: { orderBy: { timestamp: 'asc' } },
                            metaLogs: { orderBy: { timestamp: 'asc' } },
                        },
                    },
                },
            });
            return visitor || null;
        }
        catch {
            return null;
        }
    }
};
exports.AnalyticsService = AnalyticsService;
exports.AnalyticsService = AnalyticsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        redis_service_1.RedisService])
], AnalyticsService);
//# sourceMappingURL=analytics.service.js.map