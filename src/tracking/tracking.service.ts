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
      fbp?: string;
      utmSource?: string;
      utmMedium?: string;
      utmCampaign?: string;
      utmContent?: string;
      fbclid?: string;
      referer?: string;
      eventSlug?: string;
      landingUrl?: string;
    },
  ) {
    // Upsert visitor
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
    } else {
      // Update last activity
      await this.prisma.session.update({
        where: { id: session.id },
        data: { lastActivity: new Date() },
      });
    }

    return { visitor, session };
  }

  /**
   * Process a heartbeat: mark user online, create/update visitor+session.
   */
  async heartbeat(dto: HeartbeatDto) {
    await this.redis.markOnline(dto.ip);

    const { visitor, session } = await this.getOrCreateVisitorAndSession(dto.ip, {
      userAgent: dto.user_agent,
      hasAdblock: dto.has_adblock,
      fbp: dto.fbp,
      landingUrl: dto.url,
    });

    return { visitor_id: visitor.id, session_id: session.id };
  }

  /**
   * Track a user event (PageView, AddToCart, Purchase, etc.)
   */
  async trackEvent(dto: TrackEventDto) {
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

  /**
   * Log a request/response (e.g. order creation).
   */
  async trackRequestLog(dto: TrackRequestLogDto) {
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
