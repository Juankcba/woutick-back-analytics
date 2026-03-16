import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { TokenGuard } from '../auth/token.guard';
import { TrackingService } from './tracking.service';
import {
  TrackEventDto,
  TrackRequestLogDto,
  TrackMetaLogDto,
  HeartbeatDto,
} from './tracking.dto';

@ApiTags('tracking')
@ApiBearerAuth('access-token')
@Controller('track')
@UseGuards(TokenGuard)
export class TrackingController {
  constructor(private readonly trackingService: TrackingService) {}

  @Post('heartbeat')
  @ApiOperation({ summary: 'Heartbeat — mantener usuario online y crear/actualizar sesión' })
  async heartbeat(@Body() dto: HeartbeatDto) {
    return this.trackingService.heartbeat(dto);
  }

  @Post('event')
  @ApiOperation({ summary: 'Registrar evento del usuario (PageView, AddToCart, Purchase, etc.)' })
  async trackEvent(@Body() dto: TrackEventDto) {
    return this.trackingService.trackEvent(dto);
  }

  @Post('request-log')
  @ApiOperation({ summary: 'Registrar request/response (ej: creación de orden)' })
  async trackRequestLog(@Body() dto: TrackRequestLogDto) {
    return this.trackingService.trackRequestLog(dto);
  }

  @Post('meta-log')
  @ApiOperation({ summary: 'Registrar llamada a la API de conversiones de Meta' })
  async trackMetaLog(@Body() dto: TrackMetaLogDto) {
    return this.trackingService.trackMetaLog(dto);
  }
}
