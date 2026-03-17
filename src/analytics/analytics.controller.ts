import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { TokenGuard } from '../auth/token.guard';
import { AnalyticsService } from './analytics.service';

@ApiTags('analytics')
@ApiBearerAuth('access-token')
@Controller('analytics')
@UseGuards(TokenGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Dashboard general: online, totales, adblock stats' })
  async getDashboard() {
    return this.analyticsService.getDashboardStats();
  }

  @Get('full')
  @ApiOperation({ summary: 'Todo el dashboard en una sola request' })
  @ApiQuery({ name: 'environment', required: false })
  @ApiQuery({ name: 'dateFrom', required: false, example: '2026-03-01' })
  @ApiQuery({ name: 'dateTo', required: false, example: '2026-03-17' })
  async getFullDashboard(
    @Query('environment') environment?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    const [dashboard, funnel, campaigns, visitors, metaLogs] = await Promise.all([
      this.analyticsService.getDashboardStats(dateFrom, dateTo),
      this.analyticsService.getFunnel(environment, dateFrom, dateTo),
      this.analyticsService.getCampaignStats(environment, dateFrom, dateTo),
      this.analyticsService.getVisitors(1, 20, dateFrom, dateTo),
      this.analyticsService.getMetaLogs({ page: 1, limit: 20, dateFrom, dateTo }),
    ]);
    return { dashboard, funnel, campaigns, visitors, metaLogs };
  }

  @Get('online')
  @ApiOperation({ summary: 'Usuarios online ahora (IPs activas en últimos 5 min)' })
  async getOnlineCount() {
    return this.analyticsService.getOnlineCount();
  }

  @Get('visitors')
  @ApiOperation({ summary: 'Lista paginada de visitantes' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 50 })
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
  @ApiOperation({ summary: 'Sesiones de un visitante' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
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
  @ApiOperation({ summary: 'Timeline de eventos de una sesión' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
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
  @ApiOperation({ summary: 'Logs de requests de una sesión (body + response)' })
  async getRequestLogs(@Param('sessionId') sessionId: string) {
    return this.analyticsService.getRequestLogsBySession(sessionId);
  }

  @Get('meta-logs')
  @ApiOperation({ summary: 'Logs de Meta CAPI con filtros' })
  @ApiQuery({ name: 'event_name', required: false, example: 'Purchase' })
  @ApiQuery({ name: 'has_adblock', required: false, enum: ['true', 'false'] })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
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

  @Get('cookie-consent-stats')
  @ApiOperation({ summary: 'Estadísticas de consentimiento de cookies' })
  async getCookieConsentStats() {
    return this.analyticsService.getCookieConsentStats();
  }

  @Get('funnel')
  @ApiOperation({ summary: 'Funnel de conversión: PageView → AddToCart → InitiateCheckout → Purchase' })
  @ApiQuery({ name: 'environment', required: false, example: 'production' })
  async getFunnel(@Query('environment') environment?: string) {
    return this.analyticsService.getFunnel(environment);
  }

  @Get('campaign-stats')
  @ApiOperation({ summary: 'Campañas registradas con conteo de sesiones' })
  @ApiQuery({ name: 'environment', required: false })
  async getCampaignStats(@Query('environment') environment?: string) {
    return this.analyticsService.getCampaignStats(environment);
  }

  @Get('search')
  @ApiOperation({ summary: 'Buscar visitante por IP y obtener su journey completo' })
  @ApiQuery({ name: 'ip', required: true, example: '185.140.33.38' })
  async searchByIp(@Query('ip') ip: string) {
    return this.analyticsService.searchByIp(ip);
  }
}
