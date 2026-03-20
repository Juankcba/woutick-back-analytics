import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
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
    const [dashboard, campaigns] = await Promise.all([
      this.analyticsService.getDashboardStats(dateFrom, dateTo),
      this.analyticsService.getCampaignStats(environment, dateFrom, dateTo),
    ]);
    // Note: date filters are now passed to getCampaignStats to avoid full collection scans
    return { dashboard, campaigns };
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

  @Get('purchases')
  @ApiOperation({ summary: 'PurchaseConfirm events with session/visitor details' })
  @ApiQuery({ name: 'search', required: false, description: 'Search by URL, IP or order UUID' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'dateFrom', required: false })
  @ApiQuery({ name: 'dateTo', required: false })
  async getPurchases(
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.analyticsService.getPurchaseEvents({
      search,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 50,
      dateFrom,
      dateTo,
    });
  }

  @Get('campaign-urls')
  @ApiOperation({ summary: 'Generate and save campaign URLs report from CAPI logs' })
  @ApiQuery({ name: 'dateFrom', required: false })
  @ApiQuery({ name: 'dateTo', required: false })
  async getCampaignUrls(
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.analyticsService.generateCampaignReport(dateFrom, dateTo);
  }

  @Get('campaign-report/:uuid')
  @ApiOperation({ summary: 'Get a saved campaign report by UUID' })
  async getCampaignReport(@Param('uuid') uuid: string) {
    return this.analyticsService.getCampaignReport(uuid);
  }

  @Get('meta-logs')
  @ApiOperation({ summary: 'Logs de Meta CAPI con filtros' })
  @ApiQuery({ name: 'event_name', required: false, example: 'Purchase' })
  @ApiQuery({ name: 'has_adblock', required: false, enum: ['true', 'false'] })
  @ApiQuery({ name: 'search', required: false, description: 'Search by email, IP or event name' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'dateFrom', required: false, example: '2026-03-01' })
  @ApiQuery({ name: 'dateTo', required: false, example: '2026-03-19' })
  async getMetaLogs(
    @Query('event_name') eventName?: string,
    @Query('has_adblock') hasAdblock?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.analyticsService.getMetaLogs({
      event_name: eventName,
      has_adblock: hasAdblock === 'true' ? true : hasAdblock === 'false' ? false : undefined,
      search,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 50,
      dateFrom,
      dateTo,
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

  @Post('batch-purchases')
  @ApiOperation({ summary: 'Find Purchase/PurchaseConfirm events for a list of IPs' })
  async batchPurchases(@Body() body: { ips: string[] }) {
    return this.analyticsService.batchPurchasesByIps(body.ips || []);
  }
}
