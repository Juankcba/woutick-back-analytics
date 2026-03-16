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
exports.ConfigService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const CONFIG_KEY = 'global';
let ConfigService = class ConfigService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getOrCreateConfig() {
        try {
            let config = await this.prisma.appConfig.findUnique({
                where: { key: CONFIG_KEY },
            });
            if (!config) {
                config = await this.prisma.appConfig.create({
                    data: { key: CONFIG_KEY, trackingEnabled: true },
                });
            }
            return config;
        }
        catch (error) {
            return { key: CONFIG_KEY, trackingEnabled: true };
        }
    }
    async getTrackingStatus() {
        const config = await this.getOrCreateConfig();
        return { tracking_enabled: config.trackingEnabled };
    }
    async toggleTracking() {
        const config = await this.getOrCreateConfig();
        const updated = await this.prisma.appConfig.update({
            where: { key: CONFIG_KEY },
            data: { trackingEnabled: !config.trackingEnabled },
        });
        return { tracking_enabled: updated.trackingEnabled };
    }
};
exports.ConfigService = ConfigService;
exports.ConfigService = ConfigService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ConfigService);
//# sourceMappingURL=config.service.js.map