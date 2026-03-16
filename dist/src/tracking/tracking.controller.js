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
exports.TrackingController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const token_guard_1 = require("../auth/token.guard");
const tracking_service_1 = require("./tracking.service");
const tracking_dto_1 = require("./tracking.dto");
let TrackingController = class TrackingController {
    trackingService;
    constructor(trackingService) {
        this.trackingService = trackingService;
    }
    async heartbeat(dto) {
        return this.trackingService.heartbeat(dto);
    }
    async trackEvent(dto) {
        return this.trackingService.trackEvent(dto);
    }
    async trackRequestLog(dto) {
        return this.trackingService.trackRequestLog(dto);
    }
    async trackMetaLog(dto) {
        return this.trackingService.trackMetaLog(dto);
    }
};
exports.TrackingController = TrackingController;
__decorate([
    (0, common_1.Post)('heartbeat'),
    (0, swagger_1.ApiOperation)({ summary: 'Heartbeat — mantener usuario online y crear/actualizar sesión' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [tracking_dto_1.HeartbeatDto]),
    __metadata("design:returntype", Promise)
], TrackingController.prototype, "heartbeat", null);
__decorate([
    (0, common_1.Post)('event'),
    (0, swagger_1.ApiOperation)({ summary: 'Registrar evento del usuario (PageView, AddToCart, Purchase, etc.)' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [tracking_dto_1.TrackEventDto]),
    __metadata("design:returntype", Promise)
], TrackingController.prototype, "trackEvent", null);
__decorate([
    (0, common_1.Post)('request-log'),
    (0, swagger_1.ApiOperation)({ summary: 'Registrar request/response (ej: creación de orden)' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [tracking_dto_1.TrackRequestLogDto]),
    __metadata("design:returntype", Promise)
], TrackingController.prototype, "trackRequestLog", null);
__decorate([
    (0, common_1.Post)('meta-log'),
    (0, swagger_1.ApiOperation)({ summary: 'Registrar llamada a la API de conversiones de Meta' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [tracking_dto_1.TrackMetaLogDto]),
    __metadata("design:returntype", Promise)
], TrackingController.prototype, "trackMetaLog", null);
exports.TrackingController = TrackingController = __decorate([
    (0, swagger_1.ApiTags)('tracking'),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, common_1.Controller)('track'),
    (0, common_1.UseGuards)(token_guard_1.TokenGuard),
    __metadata("design:paramtypes", [tracking_service_1.TrackingService])
], TrackingController);
//# sourceMappingURL=tracking.controller.js.map