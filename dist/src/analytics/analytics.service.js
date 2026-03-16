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
        const count = await this.redis.getOnlineCount();
        const users = await this.redis.getOnlineUsers();
        return { online_count: count, online_ips: users };
    }
    async getVisitors(page = 1, limit = 50) {
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
    async getSessionsByVisitor(visitorId, page = 1, limit = 20) {
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
    async getEventsBySession(sessionId, page = 1, limit = 100) {
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
    async getRequestLogsBySession(sessionId) {
        return this.prisma.requestLog.findMany({
            where: { sessionId },
            orderBy: { timestamp: 'asc' },
        });
    }
    async getMetaLogs(filters) {
        const page = filters?.page || 1;
        const limit = filters?.limit || 50;
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
    async getAdblockStats() {
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
    async getDashboardStats() {
        const onlineData = await this.getOnlineCount();
        const [totalVisitors, totalSessions, totalEvents, totalMetaLogs] = await Promise.all([
            this.prisma.visitor.count(),
            this.prisma.session.count(),
            this.prisma.event.count(),
            this.prisma.metaLog.count(),
        ]);
        const adblockStats = await this.getAdblockStats();
        return {
            online: onlineData,
            totals: {
                visitors: totalVisitors,
                sessions: totalSessions,
                events: totalEvents,
                meta_logs: totalMetaLogs,
            },
            adblock: adblockStats,
        };
    }
};
exports.AnalyticsService = AnalyticsService;
exports.AnalyticsService = AnalyticsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        redis_service_1.RedisService])
], AnalyticsService);
//# sourceMappingURL=analytics.service.js.map