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

  /** List PurchaseConfirm events with cross-session UTM attribution */
  async getPurchaseEvents(opts: { search?: string; page: number; limit: number; dateFrom?: string; dateTo?: string }) {
    try {
      const { search, page, limit, dateFrom, dateTo } = opts;
      const dateFilter = this.buildDateFilter(dateFrom, dateTo);

      let where: any = { eventName: 'PurchaseConfirm', ...dateFilter };

      // For IP search, do a 2-step lookup (nested relation contains is too slow)
      if (search?.trim()) {
        const s = search.trim();
        // Check if it looks like an IP
        const isIp = /^\d{1,3}\./.test(s);
        if (isIp) {
          // Step 1: Find visitors by IP
          const visitors = await this.prisma.visitor.findMany({
            where: { ip: { contains: s } },
            select: { id: true },
            take: 100,
          });
          const visitorIds = visitors.map(v => v.id);
          if (visitorIds.length === 0) return { total: 0, page, limit, purchases: [] };
          where = { ...where, session: { visitorId: { in: visitorIds } } };
        } else {
          // Search by URL (order UUID, etc.)
          where.url = { contains: s, mode: 'insensitive' };
        }
      }

      const [total, events] = await Promise.all([
        this.prisma.event.count({ where }),
        this.prisma.event.findMany({
          where,
          select: {
            id: true,
            url: true,
            timestamp: true,
            customData: true,
            session: {
              select: {
                visitorId: true,
                utmSource: true,
                utmCampaign: true,
                utmMedium: true,
                utmContent: true,
                eventSlug: true,
                landingUrl: true,
                environment: true,
                visitor: { select: { ip: true } },
              },
            },
          },
          orderBy: { timestamp: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
        }),
      ]);

      // Collect visitorIds where the purchase session has NO UTM (cross-session case)
      const needUtmLookup = new Set<string>();
      for (const e of events) {
        if (!e.session?.utmSource && e.session?.visitorId) {
          needUtmLookup.add(e.session.visitorId);
        }
      }

      // Batch lookup: find the first UTM session for each visitor
      const utmByVisitor = new Map<string, any>();
      if (needUtmLookup.size > 0) {
        const utmSessions = await this.prisma.session.findMany({
          where: {
            visitorId: { in: [...needUtmLookup] },
            utmSource: { not: null },
          },
          select: {
            visitorId: true,
            utmSource: true,
            utmCampaign: true,
            utmMedium: true,
            utmContent: true,
            eventSlug: true,
            landingUrl: true,
          },
          orderBy: { startedAt: 'asc' }, // First session with UTM
        });
        for (const s of utmSessions) {
          if (!utmByVisitor.has(s.visitorId)) {
            utmByVisitor.set(s.visitorId, s);
          }
        }
      }

      const purchases = events.map(e => {
        const orderMatch = e.url?.match(/\/order\/([a-f0-9-]+)/i);
        const customData = (e.customData as any) || {};

        // Use purchase session UTM if available, otherwise fallback to first UTM session
        const sessionUtm = e.session?.utmSource ? e.session : null;
        const utmFallback = e.session?.visitorId ? utmByVisitor.get(e.session.visitorId) : null;
        const utm = sessionUtm || utmFallback;

        return {
          id: e.id,
          timestamp: e.timestamp,
          url: e.url,
          orderUuid: orderMatch?.[1] || null,
          value: customData.value || null,
          currency: customData.currency || null,
          numItems: customData.num_items || null,
          ip: e.session?.visitor?.ip || null,
          utm_source: utm?.utmSource || null,
          utm_campaign: utm?.utmCampaign || null,
          utm_medium: utm?.utmMedium || null,
          utm_content: utm?.utmContent || null,
          event_slug: utm?.eventSlug || e.session?.eventSlug || null,
          environment: e.session?.environment || null,
          crossSession: !sessionUtm && !!utmFallback, // flag if UTM came from a different session
        };
      });

      return { total, page, limit, purchases };
    } catch (e) {
      console.error('getPurchaseEvents error:', e);
      return { total: 0, page: 1, limit: 50, purchases: [] };
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

  /** Extract campaign URLs from PageView/ViewContent CAPI logs */
  async getCampaignUrlsFromLogs(dateFrom?: string, dateTo?: string) {
    try {
      const dateFilter = this.buildDateFilter(dateFrom, dateTo);
      const logs = await this.prisma.metaLog.findMany({
        where: {
          eventName: { in: ['PageView', 'ViewContent'] },
          ...dateFilter,
        },
        select: {
          eventName: true,
          clientIp: true,
          timestamp: true,
          requestPayload: true,
        },
        orderBy: { timestamp: 'desc' },
      });

      const results: any[] = [];
      for (const log of logs) {
        const payload = log.requestPayload as any;
        const eventData = payload?.data?.[0];
        const sourceUrl = eventData?.event_source_url;
        if (!sourceUrl) continue;

        try {
          const url = new URL(sourceUrl);
          const params = url.searchParams;
          // Check for any UTM or campaign-related param
          const utmKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_id', 'utm_term', 'fbclid'];
          const hasUtm = utmKeys.some(k => params.has(k));
          if (!hasUtm) continue;

          results.push({
            eventName: log.eventName,
            url: sourceUrl,
            path: url.pathname,
            utm_source: params.get('utm_source'),
            utm_medium: params.get('utm_medium'),
            utm_campaign: params.get('utm_campaign'),
            utm_content: params.get('utm_content'),
            utm_id: params.get('utm_id'),
            fbclid: params.has('fbclid'),
            ip: log.clientIp,
            timestamp: log.timestamp,
          });
        } catch { /* invalid URL */ }
      }

      // Group by utm combo
      const groupMap = new Map<string, {
        utm_source: string | null; utm_medium: string | null; utm_campaign: string | null; utm_content: string | null;
        count: number; ips: Set<string>; paths: Set<string>; entries: any[];
      }>();

      for (const r of results) {
        const key = `${r.utm_source || ''}|${r.utm_campaign || ''}|${r.utm_medium || ''}|${r.utm_content || ''}`;
        if (!groupMap.has(key)) {
          groupMap.set(key, {
            utm_source: r.utm_source, utm_medium: r.utm_medium,
            utm_campaign: r.utm_campaign, utm_content: r.utm_content,
            count: 0, ips: new Set(), paths: new Set(), entries: [],
          });
        }
        const g = groupMap.get(key)!;
        g.count++;
        if (r.ip) g.ips.add(r.ip);
        g.paths.add(r.path);
        g.entries.push({ eventName: r.eventName, ip: r.ip, path: r.path, timestamp: r.timestamp, fbclid: r.fbclid });
      }

      const grouped = [...groupMap.values()]
        .sort((a, b) => b.count - a.count)
        .map(g => ({
          utm_source: g.utm_source, utm_medium: g.utm_medium,
          utm_campaign: g.utm_campaign, utm_content: g.utm_content,
          count: g.count, uniqueIps: g.ips.size,
          paths: [...g.paths],
          entries: g.entries.slice(0, 50), // limit entries per group
          ips: [...g.ips],
        }));

      return { total: results.length, groups: grouped };
    } catch (e) {
      console.error('getCampaignUrlsFromLogs error:', e);
      return { total: 0, groups: [] };
    }
  }
}
