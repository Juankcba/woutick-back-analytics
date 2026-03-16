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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const token_guard_1 = require("../auth/token.guard");
const config_service_1 = require("./config.service");
let ConfigController = class ConfigController {
    configService;
    constructor(configService) {
        this.configService = configService;
    }
    async getTrackingStatus() {
        return this.configService.getTrackingStatus();
    }
    async toggleTracking() {
        return this.configService.toggleTracking();
    }
};
exports.ConfigController = ConfigController;
__decorate([
    (0, common_1.Get)('tracking-status'),
    (0, swagger_1.ApiOperation)({ summary: 'Check if tracking is enabled (public, no auth)' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ConfigController.prototype, "getTrackingStatus", null);
__decorate([
    (0, common_1.Patch)('toggle-tracking'),
    (0, common_1.UseGuards)(token_guard_1.TokenGuard),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, swagger_1.ApiOperation)({ summary: 'Toggle tracking on/off (requires auth)' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ConfigController.prototype, "toggleTracking", null);
exports.ConfigController = ConfigController = __decorate([
    (0, swagger_1.ApiTags)('config'),
    (0, common_1.Controller)('config'),
    __metadata("design:paramtypes", [config_service_1.ConfigService])
], ConfigController);
//# sourceMappingURL=config.controller.js.map