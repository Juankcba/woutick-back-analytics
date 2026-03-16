import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { TokenGuard } from '../auth/token.guard';
import { AnalyticsService } from './analytics.service';

@Controller('analytics')
@UseGuards(TokenGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard')
  async getDashboard() {
    return this.analyticsService.getDashboardStats();
  }

  @Get('online')
  async getOnlineCount() {
    return this.analyticsService.getOnlineCount();
  }

  @Get('visitors')
  async getVisitors(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.analyticsService.getVisitors(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 50,
    );
  }

  @Get('sessions/:visitorId')
  async getSessions(
    @Param('visitorId') visitorId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.analyticsService.getSessionsByVisitor(
      visitorId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @Get('events/:sessionId')
  async getEvents(
    @Param('sessionId') sessionId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.analyticsService.getEventsBySession(
      sessionId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 100,
    );
  }

  @Get('request-logs/:sessionId')
  async getRequestLogs(@Param('sessionId') sessionId: string) {
    return this.analyticsService.getRequestLogsBySession(sessionId);
  }

  @Get('meta-logs')
  async getMetaLogs(
    @Query('event_name') eventName?: string,
    @Query('has_adblock') hasAdblock?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.analyticsService.getMetaLogs({
      event_name: eventName,
      has_adblock: hasAdblock === 'true' ? true : hasAdblock === 'false' ? false : undefined,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 50,
    });
  }

  @Get('adblock-stats')
  async getAdblockStats() {
    return this.analyticsService.getAdblockStats();
  }
}
