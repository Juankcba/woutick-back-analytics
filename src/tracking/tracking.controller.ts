import { Controller, Post, Body, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { TokenGuard } from '../auth/token.guard';
import { TrackingService } from './tracking.service';
import {
  TrackEventDto,
  TrackRequestLogDto,
  TrackMetaLogDto,
  HeartbeatDto,
} from './tracking.dto';

/**
 * Extract client IP from request headers (x-forwarded-for, cf-connecting-ip, etc.)
 */
function extractIp(req: Request, bodyIp?: string): string {
  if (bodyIp) return bodyIp;

  const xff = req.headers['x-forwarded-for'];
  if (xff) {
    const first = Array.isArray(xff) ? xff[0] : xff.split(',')[0];
    return first.trim();
  }

  const cfIp = req.headers['cf-connecting-ip'];
  if (cfIp) return Array.isArray(cfIp) ? cfIp[0] : cfIp;

  return req.ip || '0.0.0.0';
}

@ApiTags('tracking')
@ApiBearerAuth('access-token')
@Controller('track')
@UseGuards(TokenGuard)
export class TrackingController {
  constructor(private readonly trackingService: TrackingService) {}

  @Post('heartbeat')
  @ApiOperation({ summary: 'Heartbeat — mantener usuario online y crear/actualizar sesión' })
  async heartbeat(@Body() dto: HeartbeatDto, @Req() req: Request) {
    dto.ip = extractIp(req, dto.ip);
    return this.trackingService.heartbeat(dto);
  }

  @Post('event')
  @ApiOperation({ summary: 'Registrar evento del usuario (PageView, AddToCart, Purchase, etc.)' })
  async trackEvent(@Body() dto: TrackEventDto, @Req() req: Request) {
    dto.ip = extractIp(req, dto.ip);
    return this.trackingService.trackEvent(dto);
  }

  @Post('request-log')
  @ApiOperation({ summary: 'Registrar request/response (ej: creación de orden)' })
  async trackRequestLog(@Body() dto: TrackRequestLogDto, @Req() req: Request) {
    dto.ip = extractIp(req, dto.ip);
    return this.trackingService.trackRequestLog(dto);
  }

  @Post('meta-log')
  @ApiOperation({ summary: 'Registrar llamada a la API de conversiones de Meta' })
  async trackMetaLog(@Body() dto: TrackMetaLogDto, @Req() req: Request) {
    if (!dto.ip) dto.ip = extractIp(req);
    return this.trackingService.trackMetaLog(dto);
  }
}
