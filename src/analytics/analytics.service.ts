import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class AnalyticsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  /** Online user count from Redis */
  async getOnlineCount() {
    const count = await this.redis.getOnlineCount();
    const users = await this.redis.getOnlineUsers();
    return { online_count: count, online_ips: users };
  }

  /** List visitors with pagination */
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

  /** Sessions for a specific visitor */
  async getSessionsByVisitor(visitorId: string, page = 1, limit = 20) {
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

  /** Events for a specific session */
  async getEventsBySession(sessionId: string, page = 1, limit = 100) {
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

  /** Request logs for a specific session */
  async getRequestLogsBySession(sessionId: string) {
    return this.prisma.requestLog.findMany({
      where: { sessionId },
      orderBy: { timestamp: 'asc' },
    });
  }

  /** Meta CAPI logs with optional filters */
  async getMetaLogs(filters?: {
    event_name?: string;
    has_adblock?: boolean;
    page?: number;
    limit?: number;
  }) {
    const page = filters?.page || 1;
    const limit = filters?.limit || 50;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (filters?.event_name) where.eventName = filters.event_name;
    if (filters?.has_adblock !== undefined) where.hasAdblock = filters.has_adblock;

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

  /** Ad-blocker statistics */
  async getAdblockStats() {
    const [totalVisitors, adblockVisitors, totalSessions, adblockSessions] =
      await Promise.all([
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

  /** General dashboard stats */
  async getDashboardStats() {
    const onlineData = await this.getOnlineCount();
    const [totalVisitors, totalSessions, totalEvents, totalMetaLogs] =
      await Promise.all([
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

  /** Funnel de conversión */
  async getFunnel(environment?: string) {
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

  /** Campaign stats */
  async getCampaignStats(environment?: string) {
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

  /** Search visitor by IP — full journey */
  async searchByIp(ip: string) {
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

    if (!visitor) return null;

    return visitor;
  }
}
