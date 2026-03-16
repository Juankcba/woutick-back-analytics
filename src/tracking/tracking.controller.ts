import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { TokenGuard } from '../auth/token.guard';
import { TrackingService } from './tracking.service';
import {
  TrackEventDto,
  TrackRequestLogDto,
  TrackMetaLogDto,
  HeartbeatDto,
} from './tracking.dto';

@Controller('track')
@UseGuards(TokenGuard)
export class TrackingController {
  constructor(private readonly trackingService: TrackingService) {}

  @Post('heartbeat')
  async heartbeat(@Body() dto: HeartbeatDto) {
    return this.trackingService.heartbeat(dto);
  }

  @Post('event')
  async trackEvent(@Body() dto: TrackEventDto) {
    return this.trackingService.trackEvent(dto);
  }

  @Post('request-log')
  async trackRequestLog(@Body() dto: TrackRequestLogDto) {
    return this.trackingService.trackRequestLog(dto);
  }

  @Post('meta-log')
  async trackMetaLog(@Body() dto: TrackMetaLogDto) {
    return this.trackingService.trackMetaLog(dto);
  }
}
