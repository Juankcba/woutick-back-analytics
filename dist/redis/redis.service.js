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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisService = void 0;
const common_1 = require("@nestjs/common");
const ioredis_1 = __importDefault(require("ioredis"));
const ONLINE_TTL_SECONDS = 300;
const ONLINE_SET_KEY = 'online_users';
let RedisService = class RedisService {
    client = null;
    constructor() {
        try {
            const url = process.env.REDIS_URL;
            if (url) {
                this.client = new ioredis_1.default(url, { lazyConnect: true, connectTimeout: 5000 });
                this.client.connect().catch(() => {
                    console.warn('⚠️ Redis connection failed, disabling Redis features');
                    this.client = null;
                });
            }
            else {
                console.warn('⚠️ REDIS_URL not set, Redis features disabled');
            }
        }
        catch {
            console.warn('⚠️ Redis init error, Redis features disabled');
        }
    }
    async onModuleDestroy() {
        await this.client?.quit();
    }
    async markOnline(ip) {
        if (!this.client)
            return;
        try {
            const now = Date.now();
            await this.client.zadd(ONLINE_SET_KEY, now, ip);
        }
        catch { }
    }
    async getOnlineCount() {
        if (!this.client)
            return 0;
        try {
            const cutoff = Date.now() - ONLINE_TTL_SECONDS * 1000;
            await this.client.zremrangebyscore(ONLINE_SET_KEY, '-inf', cutoff);
            return this.client.zcard(ONLINE_SET_KEY);
        }
        catch {
            return 0;
        }
    }
    async getOnlineUsers() {
        if (!this.client)
            return [];
        try {
            const cutoff = Date.now() - ONLINE_TTL_SECONDS * 1000;
            await this.client.zremrangebyscore(ONLINE_SET_KEY, '-inf', cutoff);
            return this.client.zrangebyscore(ONLINE_SET_KEY, cutoff, '+inf');
        }
        catch {
            return [];
        }
    }
    async get(key) {
        if (!this.client)
            return null;
        try {
            return this.client.get(key);
        }
        catch {
            return null;
        }
    }
    async set(key, value) {
        if (!this.client)
            return;
        try {
            await this.client.set(key, value);
        }
        catch { }
    }
};
exports.RedisService = RedisService;
exports.RedisService = RedisService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], RedisService);
//# sourceMappingURL=redis.service.js.map