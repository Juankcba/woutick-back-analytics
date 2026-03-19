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
    search?: string;
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

      // Text search: search across clientIp, eventName, and requestPayload (for email)
      if (filters?.search) {
        const searchTerm = filters.search.trim();
        where.OR = [
          { clientIp: { contains: searchTerm, mode: 'insensitive' } },
          { eventName: { contains: searchTerm, mode: 'insensitive' } },
          // Search inside requestPayload JSON for email (MongoDB string_contains on Json fields)
          { requestPayload: { string_contains: searchTerm } },
        ];
      }

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
        this.prisma.event.count({ where: { eventName: 'PurchaseConfirm', ...eventDateFilter } }),
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

  /** Funnel de conversión — optimized with groupBy */
  async getFunnel(environment?: string, dateFrom?: string, dateTo?: string) {
    try {
      const sessionEnvFilter = environment ? { environment } : {};
      const sessionDateFilter = this.buildDateFilter(dateFrom, dateTo, 'startedAt');
      const eventDateFilter = this.buildDateFilter(dateFrom, dateTo);
      const envFilter = environment ? { session: { environment } } : {};

      // Count total sessions + count distinct sessions per funnel event using groupBy
      const [totalSessions, funnelCounts] = await Promise.all([
        this.prisma.session.count({ where: { ...sessionEnvFilter, ...sessionDateFilter } }),
        // Use groupBy on eventName to count events per type, then we'll count distinct sessions
        // Since Prisma groupBy doesn't support countDistinct on relations easily,
        // we use separate count queries for each funnel step (still 4 queries but each is a simple count)
        Promise.all([
          this.prisma.event.groupBy({
            by: ['sessionId'],
            where: { eventName: 'PageView', ...envFilter, ...eventDateFilter },
          }).then(r => r.length),
          this.prisma.event.groupBy({
            by: ['sessionId'],
            where: { eventName: 'AddToCart', ...envFilter, ...eventDateFilter },
          }).then(r => r.length),
          this.prisma.event.groupBy({
            by: ['sessionId'],
            where: { eventName: { in: ['InitiateCheckout', 'begin_checkout'] }, ...envFilter, ...eventDateFilter },
          }).then(r => r.length),
          this.prisma.event.groupBy({
            by: ['sessionId'],
            where: { eventName: { in: ['Purchase', 'PurchaseConfirm'] }, ...envFilter, ...eventDateFilter },
          }).then(r => r.length),
        ]),
      ]);

      const [pageView, addToCart, initiateCheckout, purchase] = funnelCounts;
      const pct = (count: number) => totalSessions > 0 ? Math.round((count / totalSessions) * 1000) / 10 : 0;

      return {
        total_sessions: totalSessions,
        funnel: [
          { step: 'PageView', sessions: pageView, percentage: pct(pageView) },
          { step: 'AddToCart', sessions: addToCart, percentage: pct(addToCart) },
          { step: 'InitiateCheckout', sessions: initiateCheckout, percentage: pct(initiateCheckout) },
          { step: 'Purchase', sessions: purchase, percentage: pct(purchase) },
        ],
      };
    } catch {
      return { total_sessions: 0, funnel: [] };
    }
  }

  /** Campaign stats with purchase counts — visitor-level attribution */
  async getCampaignStats(environment?: string, dateFrom?: string, dateTo?: string) {
    try {
      const envFilter = environment ? { environment } : {};
      const sessionDateFilter = this.buildDateFilter(dateFrom, dateTo, 'startedAt');

      // Query 1: Sessions with UTM — select only needed fields
      const sessions = await this.prisma.session.findMany({
        where: { utmSource: { not: null }, ...envFilter, ...sessionDateFilter },
        select: {
          visitorId: true,
          utmSource: true,
          utmCampaign: true,
          utmMedium: true,
          utmContent: true,
          eventSlug: true,
          landingUrl: true,
          visitor: { select: { ip: true } },
        },
      });

      // Group sessions by utm combo (including utmContent)
      const groupMap = new Map<string, {
        utmSource: string; utmCampaign: string | null; utmMedium: string | null; utmContent: string | null;
        count: number; ips: Set<string>; visitorIds: Set<string>;
      }>();
      const visitorCampaignInfo = new Map<string, any>();

      for (const s of sessions) {
        const key = `${s.utmSource}|${s.utmCampaign || ''}|${s.utmMedium || ''}|${s.utmContent || ''}`;
        if (!groupMap.has(key)) {
          groupMap.set(key, {
            utmSource: s.utmSource!, utmCampaign: s.utmCampaign, utmMedium: s.utmMedium, utmContent: s.utmContent,
            count: 0, ips: new Set(), visitorIds: new Set(),
          });
        }
        const g = groupMap.get(key)!;
        g.count++;
        if (s.visitor?.ip) g.ips.add(s.visitor.ip);
        g.visitorIds.add(s.visitorId);

        if (!visitorCampaignInfo.has(s.visitorId)) {
          visitorCampaignInfo.set(s.visitorId, {
            utmSource: s.utmSource!, utmCampaign: s.utmCampaign, utmMedium: s.utmMedium,
            utmContent: s.utmContent, eventSlug: s.eventSlug, landingUrl: s.landingUrl,
            ip: s.visitor?.ip || null,
          });
        }
      }

      // Collect all visitor IDs
      const allVisitorIds = new Set<string>();
      for (const g of groupMap.values()) {
        for (const vid of g.visitorIds) allVisitorIds.add(vid);
      }

      // Query 2: PurchaseConfirm events for campaign visitors
      const purchaseEvents = allVisitorIds.size > 0
        ? await this.prisma.event.findMany({
            where: {
              eventName: 'PurchaseConfirm',
              session: { visitorId: { in: [...allVisitorIds] } },
            },
            select: {
              url: true,
              timestamp: true,
              session: { select: { visitorId: true } },
            },
          })
        : [];

      // Group purchases by visitor
      const purchasesByVisitor = new Map<string, any[]>();
      for (const pe of purchaseEvents) {
        const vid = pe.session.visitorId;
        if (!purchasesByVisitor.has(vid)) purchasesByVisitor.set(vid, []);
        purchasesByVisitor.get(vid)!.push({ url: pe.url, timestamp: pe.timestamp });
      }

      // Assemble, sort, take top 50
      return [...groupMap.entries()]
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 50)
        .map(([, c]) => {
          const purchaseDetails: any[] = [];
          for (const vid of c.visitorIds) {
            const purchases = purchasesByVisitor.get(vid);
            if (purchases) {
              const info = visitorCampaignInfo.get(vid);
              for (const p of purchases) {
                purchaseDetails.push({
                  ip: info?.ip || null, url: p.url, timestamp: p.timestamp,
                  utm_source: info?.utmSource, utm_campaign: info?.utmCampaign,
                  utm_medium: info?.utmMedium, utm_content: info?.utmContent,
                  event_slug: info?.eventSlug, landing_url: info?.landingUrl,
                });
              }
            }
          }
          return {
            utm_source: c.utmSource, utm_campaign: c.utmCampaign,
            utm_medium: c.utmMedium, utm_content: c.utmContent,
            sessions: c.count, purchases: purchaseDetails.length,
            purchaseDetails, ips: [...c.ips],
          };
        });
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
