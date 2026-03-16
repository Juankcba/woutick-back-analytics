"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const token_guard_1 = require("../auth/token.guard");
const analytics_service_1 = require("./analytics.service");
let AnalyticsController = class AnalyticsController {
    analyticsService;
    constructor(analyticsService) {
        this.analyticsService = analyticsService;
    }
    async getDashboard() {
        return this.analyticsService.getDashboardStats();
    }
    async getFullDashboard(environment) {
        const [dashboard, funnel, campaigns, visitors, metaLogs] = await Promise.all([
            this.analyticsService.getDashboardStats(),
            this.analyticsService.getFunnel(environment),
            this.analyticsService.getCampaignStats(environment),
            this.analyticsService.getVisitors(1, 20),
            this.analyticsService.getMetaLogs({ page: 1, limit: 20 }),
        ]);
        return { dashboard, funnel, campaigns, visitors, metaLogs };
    }
    async getOnlineCount() {
        return this.analyticsService.getOnlineCount();
    }
    async getVisitors(page, limit) {
        return this.analyticsService.getVisitors(page ? parseInt(page, 10) : 1, limit ? parseInt(limit, 10) : 50);
    }
    async getSessions(visitorId, page, limit) {
        return this.analyticsService.getSessionsByVisitor(visitorId, page ? parseInt(page, 10) : 1, limit ? parseInt(limit, 10) : 20);
    }
    async getEvents(sessionId, page, limit) {
        return this.analyticsService.getEventsBySession(sessionId, page ? parseInt(page, 10) : 1, limit ? parseInt(limit, 10) : 100);
    }
    async getRequestLogs(sessionId) {
        return this.analyticsService.getRequestLogsBySession(sessionId);
    }
    async getMetaLogs(eventName, hasAdblock, page, limit) {
        return this.analyticsService.getMetaLogs({
            event_name: eventName,
            has_adblock: hasAdblock === 'true' ? true : hasAdblock === 'false' ? false : undefined,
            page: page ? parseInt(page, 10) : 1,
            limit: limit ? parseInt(limit, 10) : 50,
        });
    }
    async getAdblockStats() {
        return this.analyticsService.getAdblockStats();
    }
    async getFunnel(environment) {
        return this.analyticsService.getFunnel(environment);
    }
    async getCampaignStats(environment) {
        return this.analyticsService.getCampaignStats(environment);
    }
    async searchByIp(ip) {
        return this.analyticsService.searchByIp(ip);
    }
};
exports.AnalyticsController = AnalyticsController;
__decorate([
    (0, common_1.Get)('dashboard'),
    (0, swagger_1.ApiOperation)({ summary: 'Dashboard general: online, totales, adblock stats' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getDashboard", null);
__decorate([
    (0, common_1.Get)('full'),
    (0, swagger_1.ApiOperation)({ summary: 'Todo el dashboard en una sola request' }),
    (0, swagger_1.ApiQuery)({ name: 'environment', required: false }),
    __param(0, (0, common_1.Query)('environment')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getFullDashboard", null);
__decorate([
    (0, common_1.Get)('online'),
    (0, swagger_1.ApiOperation)({ summary: 'Usuarios online ahora (IPs activas en últimos 5 min)' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getOnlineCount", null);
__decorate([
    (0, common_1.Get)('visitors'),
    (0, swagger_1.ApiOperation)({ summary: 'Lista paginada de visitantes' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, example: 1 }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, example: 50 }),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getVisitors", null);
__decorate([
    (0, common_1.Get)('sessions/:visitorId'),
    (0, swagger_1.ApiOperation)({ summary: 'Sesiones de un visitante' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false }),
    __param(0, (0, common_1.Param)('visitorId')),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getSessions", null);
__decorate([
    (0, common_1.Get)('events/:sessionId'),
    (0, swagger_1.ApiOperation)({ summary: 'Timeline de eventos de una sesión' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false }),
    __param(0, (0, common_1.Param)('sessionId')),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getEvents", null);
__decorate([
    (0, common_1.Get)('request-logs/:sessionId'),
    (0, swagger_1.ApiOperation)({ summary: 'Logs de requests de una sesión (body + response)' }),
    __param(0, (0, common_1.Param)('sessionId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getRequestLogs", null);
__decorate([
    (0, common_1.Get)('meta-logs'),
    (0, swagger_1.ApiOperation)({ summary: 'Logs de Meta CAPI con filtros' }),
    (0, swagger_1.ApiQuery)({ name: 'event_name', required: false, example: 'Purchase' }),
    (0, swagger_1.ApiQuery)({ name: 'has_adblock', required: false, enum: ['true', 'false'] }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false }),
    __param(0, (0, common_1.Query)('event_name')),
    __param(1, (0, common_1.Query)('has_adblock')),
    __param(2, (0, common_1.Query)('page')),
    __param(3, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getMetaLogs", null);
__decorate([
    (0, common_1.Get)('adblock-stats'),
    (0, swagger_1.ApiOperation)({ summary: 'Estadísticas de uso de AdBlocker' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getAdblockStats", null);
__decorate([
    (0, common_1.Get)('funnel'),
    (0, swagger_1.ApiOperation)({ summary: 'Funnel de conversión: PageView → AddToCart → InitiateCheckout → Purchase' }),
    (0, swagger_1.ApiQuery)({ name: 'environment', required: false, example: 'production' }),
    __param(0, (0, common_1.Query)('environment')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getFunnel", null);
__decorate([
    (0, common_1.Get)('campaign-stats'),
    (0, swagger_1.ApiOperation)({ summary: 'Campañas registradas con conteo de sesiones' }),
    (0, swagger_1.ApiQuery)({ name: 'environment', required: false }),
    __param(0, (0, common_1.Query)('environment')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getCampaignStats", null);
__decorate([
    (0, common_1.Get)('search'),
    (0, swagger_1.ApiOperation)({ summary: 'Buscar visitante por IP y obtener su journey completo' }),
    (0, swagger_1.ApiQuery)({ name: 'ip', required: true, example: '185.140.33.38' }),
    __param(0, (0, common_1.Query)('ip')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "searchByIp", null);
exports.AnalyticsController = AnalyticsController = __decorate([
    (0, swagger_1.ApiTags)('analytics'),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, common_1.Controller)('analytics'),
    (0, common_1.UseGuards)(token_guard_1.TokenGuard),
    __metadata("design:paramtypes", [analytics_service_1.AnalyticsService])
], AnalyticsController);
//# sourceMappingURL=analytics.controller.js.map