"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokenGuard = void 0;
const common_1 = require("@nestjs/common");
const API_TOKEN = process.env.API_TOKEN || 'wk_analytics_s3cr3t_t0k3n_2026';
let TokenGuard = class TokenGuard {
    canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const authHeader = request.headers['authorization'];
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new common_1.UnauthorizedException('Missing or invalid authorization header');
        }
        const token = authHeader.slice(7);
        if (token !== API_TOKEN) {
            throw new common_1.UnauthorizedException('Invalid token');
        }
        return true;
    }
};
exports.TokenGuard = TokenGuard;
exports.TokenGuard = TokenGuard = __decorate([
    (0, common_1.Injectable)()
], TokenGuard);
//# sourceMappingURL=token.guard.js.map