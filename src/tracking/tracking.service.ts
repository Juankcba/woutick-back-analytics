import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import {
  TrackEventDto,
  TrackRequestLogDto,
  TrackMetaLogDto,
  HeartbeatDto,
} from './tracking.dto';

// Session inactivity timeout: 30 minutes
const SESSION_TIMEOUT_MS = 30 * 60 * 1000;

@Injectable()
export class TrackingService {
  private readonly logger = new Logger(TrackingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  /**
   * Find or create a visitor by IP, and find or create an active session.
   */
  private async getOrCreateVisitorAndSession(
    ip: string,
    options?: {
      userAgent?: string;
      hasAdblock?: boolean;
      cookieConsent?: boolean;
      fbp?: string;
      utmSource?: string;
      utmMedium?: string;
      utmCampaign?: string;
      utmContent?: string;
      fbclid?: string;
      referer?: string;
      eventSlug?: string;
      landingUrl?: string;
      environment?: string;
      name?: string;
      phone?: string;
      email?: string;
    },
  ) {
    // Upsert visitor
    const visitor = await this.prisma.visitor.upsert({
      where: { ip },
      update: {
        lastSeen: new Date(),
        ...(options?.userAgent && { userAgent: options.userAgent }),
        ...(options?.hasAdblock !== undefined && { hasAdblock: options.hasAdblock }),
        ...(options?.cookieConsent !== undefined && { cookieConsent: options.cookieConsent }),
        ...(options?.fbp && { fbp: options.fbp }),
        ...(options?.name && { name: options.name }),
        ...(options?.phone && { phone: options.phone }),
        ...(options?.email && { email: options.email }),
      },
      create: {
        ip,
        userAgent: options?.userAgent,
        hasAdblock: options?.hasAdblock ?? false,
        cookieConsent: options?.cookieConsent,
        fbp: options?.fbp,
        name: options?.name,
        phone: options?.phone,
        email: options?.email,
      },
    });

    // Find active session (last activity within 30 min)
    const cutoff = new Date(Date.now() - SESSION_TIMEOUT_MS);
    let session = await this.prisma.session.findFirst({
      where: {
        visitorId: visitor.id,
        lastActivity: { gte: cutoff },
      },
      orderBy: { lastActivity: 'desc' },
    });

    if (!session) {
      // Create new session
      session = await this.prisma.session.create({
        data: {
          visitorId: visitor.id,
          environment: options?.environment ?? 'production',
          landingUrl: options?.landingUrl,
          utmSource: options?.utmSource,
          utmMedium: options?.utmMedium,
          utmCampaign: options?.utmCampaign,
          utmContent: options?.utmContent,
          fbclid: options?.fbclid,
          referer: options?.referer,
          eventSlug: options?.eventSlug,
          hasAdblock: options?.hasAdblock ?? false,
          cookieConsent: options?.cookieConsent,
        },
      });
    } else {
      // Update last activity + backfill UTM if session was created without it
      const updateData: any = { lastActivity: new Date() };
      if (!session.utmSource && options?.utmSource) {
        updateData.utmSource = options.utmSource;
        updateData.utmMedium = options.utmMedium;
        updateData.utmCampaign = options.utmCampaign;
        updateData.utmContent = options.utmContent;
        updateData.fbclid = options.fbclid;
        updateData.referer = options.referer;
        if (options.eventSlug) updateData.eventSlug = options.eventSlug;
        if (options.landingUrl) updateData.landingUrl = options.landingUrl;
      }
      await this.prisma.session.update({
        where: { id: session.id },
        data: updateData,
      });
    }

    return { visitor, session };
  }

  /**
   * Process a heartbeat: mark user online, create/update visitor+session.
   */
  async heartbeat(dto: HeartbeatDto) {
    await this.redis.markOnline(dto.ip!);

    const { visitor, session } = await this.getOrCreateVisitorAndSession(dto.ip!, {
      userAgent: dto.user_agent,
      hasAdblock: dto.has_adblock,
      cookieConsent: dto.cookie_consent,
      fbp: dto.fbp,
      landingUrl: dto.url,
      environment: dto.environment,
    });

    return { visitor_id: visitor.id, session_id: session.id };
  }

  /**
   * Track a user event (PageView, AddToCart, Purchase, etc.)
   */
  async trackEvent(dto: TrackEventDto) {
    await this.redis.markOnline(dto.ip!);

    const { session } = await this.getOrCreateVisitorAndSession(dto.ip!, {
      userAgent: dto.user_agent,
      hasAdblock: dto.has_adblock,
      cookieConsent: dto.cookie_consent,
      fbp: dto.fbp,
      utmSource: dto.utm_source,
      utmMedium: dto.utm_medium,
      utmCampaign: dto.utm_campaign,
      utmContent: dto.utm_content,
      fbclid: dto.fbclid,
      referer: dto.referer,
      eventSlug: dto.event_slug,
      landingUrl: dto.url,
      environment: dto.environment,
      name: dto.name,
      phone: dto.phone,
      email: dto.email,
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

  /**
   * Log a request/response (e.g. order creation).
   */
  async trackRequestLog(dto: TrackRequestLogDto) {
    const { session } = await this.getOrCreateVisitorAndSession(dto.ip!);

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

  /**
   * Log a Meta CAPI call with full details.
   */
  async trackMetaLog(dto: TrackMetaLogDto) {
    let sessionId: string | undefined;

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
        responseStatus: dto.response_status ?? undefined,
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
}
