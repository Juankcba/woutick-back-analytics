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
const redis_service_1 = require("../redis/redis.service");
const CONFIG_KEY = 'global';
const REDIS_TRACKING_KEY = 'tracking_enabled';
let ConfigService = class ConfigService {
    prisma;
    redis;
    constructor(prisma, redis) {
        this.prisma = prisma;
        this.redis = redis;
        this.syncTrackingToRedis().catch(() => { });
    }
    async syncTrackingToRedis() {
        try {
            const config = await this.prisma.appConfig.findUnique({
                where: { key: CONFIG_KEY },
            });
            const value = config?.trackingEnabled ?? true;
            await this.redis.set(REDIS_TRACKING_KEY, value ? '1' : '0');
        }
        catch {
        }
    }
    async getTrackingStatus() {
        try {
            const cached = await this.redis.get(REDIS_TRACKING_KEY);
            if (cached !== null) {
                return { tracking_enabled: cached === '1' };
            }
        }
        catch { }
        try {
            const config = await this.prisma.appConfig.findUnique({
                where: { key: CONFIG_KEY },
            });
            const value = config?.trackingEnabled ?? true;
            await this.redis.set(REDIS_TRACKING_KEY, value ? '1' : '0').catch(() => { });
            return { tracking_enabled: value };
        }
        catch {
            return { tracking_enabled: true };
        }
    }
    async setTracking(enabled) {
        try {
            let newValue;
            if (enabled !== undefined) {
                newValue = enabled;
            }
            else {
                const current = await this.getTrackingStatus();
                newValue = !current.tracking_enabled;
            }
            await this.redis.set(REDIS_TRACKING_KEY, newValue ? '1' : '0').catch(() => { });
            try {
                const existing = await this.prisma.appConfig.findUnique({
                    where: { key: CONFIG_KEY },
                });
                if (existing) {
                    await this.prisma.appConfig.update({
                        where: { key: CONFIG_KEY },
                        data: { trackingEnabled: newValue },
                    });
                }
                else {
                    await this.prisma.appConfig.create({
                        data: { key: CONFIG_KEY, trackingEnabled: newValue },
                    });
                }
            }
            catch {
            }
            return { tracking_enabled: newValue };
        }
        catch {
            return { tracking_enabled: enabled ?? true };
        }
    }
};
exports.ConfigService = ConfigService;
exports.ConfigService = ConfigService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        redis_service_1.RedisService])
], ConfigService);
//# sourceMappingURL=config.service.js.map