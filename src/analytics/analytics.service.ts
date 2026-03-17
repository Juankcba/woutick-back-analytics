import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class AnalyticsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  /** Build a Prisma date range filter for a given timestamp field */
  private buildDateFilter(dateFrom?: string, dateTo?: string, field = 'timestamp') {
    if (!dateFrom && !dateTo) return {};
    const filter: any = {};
    if (dateFrom) filter.gte = new Date(dateFrom);
    if (dateTo) {
      const to = new Date(dateTo);
      to.setHours(23, 59, 59, 999);
      filter.lte = to;
    }
    return { [field]: filter };
  }

  /** Online user count from Redis */
  async getOnlineCount() {
    try {
      const count = await this.redis.getOnlineCount();
      const users = await this.redis.getOnlineUsers();
      return { online_count: count, online_ips: users };
    } catch {
      return { online_count: 0, online_ips: [] };
    }
  }

  /** List visitors with pagination */
  async getVisitors(page = 1, limit = 50, dateFrom?: string, dateTo?: string) {
    try {
      const skip = (page - 1) * limit;
      const dateFilter = this.buildDateFilter(dateFrom, dateTo, 'lastSeen');
      const where: any = { ...dateFilter };
      const [visitors, total] = await Promise.all([
        this.prisma.visitor.findMany({
          where,
          orderBy: { lastSeen: 'desc' },
          skip,
          take: limit,
          include: {
            _count: { select: { sessions: true } },
            sessions: {
              orderBy: { startedAt: 'desc' },
              take: 1,
              select: { landingUrl: true, environment: true },
            },
          },
        }),
        this.prisma.visitor.count({ where }),
      ]);

      // Flatten latest session data onto visitor object
      const mapped = visitors.map((v: any) => {
        const latest = v.sessions?.[0];
        return {
          ...v,
          landingUrl: latest?.landingUrl || null,
          environment: latest?.environment || null,
          sessions: undefined, // Remove raw sessions array
        };
      });

      return { visitors: mapped, total, page, limit };
    } catch {
      return { visitors: [], total: 0, page, limit };
    }
  }

  /** Sessions for a specific visitor */
  async getSessionsByVisitor(visitorId: string, page = 1, limit = 20) {
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
    } catch {
      return { sessions: [], total: 0, page, limit };
    }
  }

  /** Events for a specific session */
  async getEventsBySession(sessionId: string, page = 1, limit = 100) {
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
    } catch {
      return { events: [], total: 0, page, limit };
    }
  }

  /** Request logs for a specific session */
  async getRequestLogsBySession(sessionId: string) {
    try {
      return await this.prisma.requestLog.findMany({
        where: { sessionId },
        orderBy: { timestamp: 'asc' },
      });
    } catch {
      return [];
    }
  }

  /** Meta CAPI logs with optional filters */
  async getMetaLogs(filters?: {
    event_name?: string;
    has_adblock?: boolean;
    page?: number;
    limit?: number;
    dateFrom?: string;
    dateTo?: string;
  }) {
    const page = filters?.page || 1;
    const limit = filters?.limit || 50;

    try {
      const skip = (page - 1) * limit;
      const dateFilter = this.buildDateFilter(filters?.dateFrom, filters?.dateTo);
      const where: any = { ...dateFilter };
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
    } catch {
      return { logs: [], total: 0, page, limit };
    }
  }

  /** Cookie consent statistics */
  async getCookieConsentStats() {
    try {
      const [totalVisitors, consentYes, consentNo, totalSessions, sessionConsentYes, sessionConsentNo] =
        await Promise.all([
          this.prisma.visitor.count(),
          this.prisma.visitor.count({ where: { cookieConsent: true } }),
          this.prisma.visitor.count({ where: { cookieConsent: false } }),
          this.prisma.session.count(),
          this.prisma.session.count({ where: { cookieConsent: true } }),
          this.prisma.session.count({ where: { cookieConsent: false } }),
        ]);

      return {
        visitors: {
          total: totalVisitors,
          accepted: consentYes,
          rejected: consentNo,
          unknown: totalVisitors - consentYes - consentNo,
          accepted_pct: totalVisitors > 0 ? Math.round((consentYes / totalVisitors) * 1000) / 10 : 0,
          rejected_pct: totalVisitors > 0 ? Math.round((consentNo / totalVisitors) * 1000) / 10 : 0,
        },
        sessions: {
          total: totalSessions,
          accepted: sessionConsentYes,
          rejected: sessionConsentNo,
          unknown: totalSessions - sessionConsentYes - sessionConsentNo,
          accepted_pct: totalSessions > 0 ? Math.round((sessionConsentYes / totalSessions) * 1000) / 10 : 0,
          rejected_pct: totalSessions > 0 ? Math.round((sessionConsentNo / totalSessions) * 1000) / 10 : 0,
        },
      };
    } catch {
      return {
        visitors: { total: 0, accepted: 0, rejected: 0, unknown: 0, accepted_pct: 0, rejected_pct: 0 },
        sessions: { total: 0, accepted: 0, rejected: 0, unknown: 0, accepted_pct: 0, rejected_pct: 0 },
      };
    }
  }

  /** General dashboard stats — single parallel batch */
  async getDashboardStats(dateFrom?: string, dateTo?: string) {
    try {
      const sessionDateFilter = this.buildDateFilter(dateFrom, dateTo, 'startedAt');
      const eventDateFilter = this.buildDateFilter(dateFrom, dateTo);
      const visitorDateFilter = this.buildDateFilter(dateFrom, dateTo, 'lastSeen');
      const [
        onlineData,
        totalVisitors,
        totalSessions,
        totalEvents,
        totalMetaLogs,
        totalPurchases,
      ] = await Promise.all([
        this.getOnlineCount(),
        this.prisma.visitor.count({ where: visitorDateFilter }),
        this.prisma.session.count({ where: sessionDateFilter }),
        this.prisma.event.count({ where: eventDateFilter }),
        this.prisma.metaLog.count({ where: eventDateFilter }),
        this.prisma.event.count({ where: { eventName: { in: ['Purchase', 'PurchaseConfirm'] }, ...eventDateFilter } }),
      ]);

      return {
        online: onlineData,
        totals: {
          visitors: totalVisitors,
          sessions: totalSessions,
          events: totalEvents,
          meta_logs: totalMetaLogs,
          purchases: totalPurchases,
        },
      };
    } catch {
      return {
        online: { online_count: 0, online_ips: [] },
        totals: { visitors: 0, sessions: 0, events: 0, meta_logs: 0, purchases: 0 },
      };
    }
  }

  /** Funnel de conversión */
  async getFunnel(environment?: string, dateFrom?: string, dateTo?: string) {
    try {
      const envFilter = environment ? { session: { environment } } : {};
      const sessionEnvFilter = environment ? { environment } : {};
      const sessionDateFilter = this.buildDateFilter(dateFrom, dateTo, 'startedAt');
      const eventDateFilter = this.buildDateFilter(dateFrom, dateTo);

      // Count unique sessions that have each event type
      const [totalSessions, pageViewSessions, addToCartSessions, checkoutSessions, purchaseSessions] = await Promise.all([
        this.prisma.session.count({ where: { ...sessionEnvFilter, ...sessionDateFilter } }),
        this.prisma.event.groupBy({
          by: ['sessionId'],
          where: { eventName: 'PageView', ...envFilter, ...eventDateFilter },
        }),
        this.prisma.event.groupBy({
          by: ['sessionId'],
          where: { eventName: 'AddToCart', ...envFilter, ...eventDateFilter },
        }),
        this.prisma.event.groupBy({
          by: ['sessionId'],
          where: { eventName: 'InitiateCheckout', ...envFilter, ...eventDateFilter },
        }),
        this.prisma.event.groupBy({
          by: ['sessionId'],
          where: { eventName: { in: ['Purchase', 'PurchaseConfirm'] }, ...envFilter, ...eventDateFilter },
        }),
      ]);

      const pct = (count: number) => totalSessions > 0 ? Math.round((count / totalSessions) * 1000) / 10 : 0;

      return {
        total_sessions: totalSessions,
        funnel: [
          { step: 'PageView', sessions: pageViewSessions.length, percentage: pct(pageViewSessions.length) },
          { step: 'AddToCart', sessions: addToCartSessions.length, percentage: pct(addToCartSessions.length) },
          { step: 'InitiateCheckout', sessions: checkoutSessions.length, percentage: pct(checkoutSessions.length) },
          { step: 'Purchase', sessions: purchaseSessions.length, percentage: pct(purchaseSessions.length) },
        ],
      };
    } catch {
      return { total_sessions: 0, funnel: [] };
    }
  }

  /** Campaign stats with purchase counts */
  async getCampaignStats(environment?: string, dateFrom?: string, dateTo?: string) {
    try {
      const envFilter = environment ? { environment } : {};
      const sessionDateFilter = this.buildDateFilter(dateFrom, dateTo, 'startedAt');
      const eventDateFilter = this.buildDateFilter(dateFrom, dateTo);

      // Use findMany instead of groupBy (Prisma groupBy is unreliable with MongoDB optional fields)
      const sessions = await this.prisma.session.findMany({
        where: {
          utmSource: { not: null },
          ...envFilter,
          ...sessionDateFilter,
        },
        select: {
          utmSource: true,
          utmCampaign: true,
          utmMedium: true,
          visitor: { select: { ip: true } },
        },
      });

      // Manual grouping by utm combo
      const groupMap = new Map<string, { utmSource: string; utmCampaign: string | null; utmMedium: string | null; count: number; ips: Set<string> }>();
      for (const s of sessions) {
        const key = `${s.utmSource}|${s.utmCampaign || ''}|${s.utmMedium || ''}`;
        if (!groupMap.has(key)) {
          groupMap.set(key, { utmSource: s.utmSource!, utmCampaign: s.utmCampaign, utmMedium: s.utmMedium, count: 0, ips: new Set() });
        }
        const g = groupMap.get(key)!;
        g.count++;
        if (s.visitor?.ip) g.ips.add(s.visitor.ip);
      }

      // Sort by session count desc, take top 50
      const grouped = [...groupMap.values()].sort((a, b) => b.count - a.count).slice(0, 50);

      // Get purchase counts per campaign combination
      const campaignsWithDetails = await Promise.all(
        grouped.map(async (c) => {
          const purchases = await this.prisma.event.count({
            where: {
              eventName: { in: ['Purchase', 'PurchaseConfirm'] },
              ...eventDateFilter,
              session: {
                utmSource: c.utmSource,
                utmCampaign: c.utmCampaign,
                utmMedium: c.utmMedium,
                ...envFilter,
              },
            },
          });
          return {
            utm_source: c.utmSource,
            utm_campaign: c.utmCampaign,
            utm_medium: c.utmMedium,
            sessions: c.count,
            purchases,
            ips: [...c.ips],
          };
        }),
      );

      return campaignsWithDetails;
    } catch {
      return [];
    }
  }

  /** Search visitor by IP — full journey */
  async searchByIp(ip: string) {
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
    } catch {
      return null;
    }
  }
}
