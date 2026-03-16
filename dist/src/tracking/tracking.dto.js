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
exports.HeartbeatDto = exports.TrackMetaLogDto = exports.TrackRequestLogDto = exports.TrackEventDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class TrackEventDto {
    ip;
    user_agent;
    session_id;
    event_name;
    event_id;
    url;
    slug;
    custom_data;
    utm_source;
    utm_medium;
    utm_campaign;
    utm_content;
    fbclid;
    referer;
    event_slug;
    fbp;
    has_adblock;
}
exports.TrackEventDto = TrackEventDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'IP del visitante', example: '185.140.33.38' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TrackEventDto.prototype, "ip", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'User-Agent del navegador' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], TrackEventDto.prototype, "user_agent", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'ID de sesión existente (para reutilizar)' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], TrackEventDto.prototype, "session_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Nombre del evento', example: 'AddToCart' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TrackEventDto.prototype, "event_name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Event ID para deduplicación con Meta', example: 'atc_abc123_1234567890' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], TrackEventDto.prototype, "event_id", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'URL donde ocurrió el evento' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], TrackEventDto.prototype, "url", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Slug del evento', example: 'festival-2026' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], TrackEventDto.prototype, "slug", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Datos personalizados del evento', example: { value: 13.92, currency: 'EUR' } }),
    (0, class_validator_1.IsObject)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], TrackEventDto.prototype, "custom_data", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'facebook' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], TrackEventDto.prototype, "utm_source", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'cpc' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], TrackEventDto.prototype, "utm_medium", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'summer_sale' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], TrackEventDto.prototype, "utm_campaign", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'banner_ad_1' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], TrackEventDto.prototype, "utm_content", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Facebook Click ID' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], TrackEventDto.prototype, "fbclid", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], TrackEventDto.prototype, "referer", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Slug del evento visitado', example: 'festival-2026' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], TrackEventDto.prototype, "event_slug", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Cookie _fbp de Meta' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], TrackEventDto.prototype, "fbp", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '¿El usuario tiene ad-blocker activo?' }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], TrackEventDto.prototype, "has_adblock", void 0);
class TrackRequestLogDto {
    ip;
    session_id;
    method;
    endpoint;
    status_code;
    request_body;
    response_body;
    duration_ms;
}
exports.TrackRequestLogDto = TrackRequestLogDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'IP del visitante', example: '185.140.33.38' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TrackRequestLogDto.prototype, "ip", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'ID de sesión existente' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], TrackRequestLogDto.prototype, "session_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Método HTTP', example: 'POST' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TrackRequestLogDto.prototype, "method", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Endpoint', example: '/order/' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TrackRequestLogDto.prototype, "endpoint", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Código de respuesta HTTP', example: 200 }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], TrackRequestLogDto.prototype, "status_code", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Body del request' }),
    (0, class_validator_1.IsObject)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], TrackRequestLogDto.prototype, "request_body", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Body de la respuesta' }),
    (0, class_validator_1.IsObject)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], TrackRequestLogDto.prototype, "response_body", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Duración en ms', example: 150 }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], TrackRequestLogDto.prototype, "duration_ms", void 0);
class TrackMetaLogDto {
    ip;
    session_id;
    event_name;
    event_id;
    pixel_id;
    route;
    request_payload;
    response_payload;
    has_fbp;
    has_fbc;
    has_email;
    has_phone;
    has_fn;
    has_ln;
    client_ip;
    has_adblock;
}
exports.TrackMetaLogDto = TrackMetaLogDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'IP del visitante' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], TrackMetaLogDto.prototype, "ip", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'ID de sesión existente' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], TrackMetaLogDto.prototype, "session_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Nombre del evento Meta', example: 'Purchase' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TrackMetaLogDto.prototype, "event_name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Event ID para deduplicación' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], TrackMetaLogDto.prototype, "event_id", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'ID del pixel Meta' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], TrackMetaLogDto.prototype, "pixel_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Ruta CAPI usada', example: '/api/meta/conversion' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TrackMetaLogDto.prototype, "route", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Payload completo enviado a Meta' }),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], TrackMetaLogDto.prototype, "request_payload", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Respuesta de Meta' }),
    (0, class_validator_1.IsObject)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], TrackMetaLogDto.prototype, "response_payload", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '¿El payload incluye fbp?' }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], TrackMetaLogDto.prototype, "has_fbp", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '¿El payload incluye fbc?' }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], TrackMetaLogDto.prototype, "has_fbc", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '¿El payload incluye email hash?' }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], TrackMetaLogDto.prototype, "has_email", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '¿El payload incluye phone hash?' }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], TrackMetaLogDto.prototype, "has_phone", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '¿El payload incluye first name hash?' }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], TrackMetaLogDto.prototype, "has_fn", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '¿El payload incluye last name hash?' }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], TrackMetaLogDto.prototype, "has_ln", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'IP del cliente capturada server-side' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], TrackMetaLogDto.prototype, "client_ip", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '¿El usuario tenía ad-blocker?' }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], TrackMetaLogDto.prototype, "has_adblock", void 0);
class HeartbeatDto {
    ip;
    user_agent;
    url;
    has_adblock;
    fbp;
}
exports.HeartbeatDto = HeartbeatDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'IP del visitante', example: '185.140.33.38' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], HeartbeatDto.prototype, "ip", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'User-Agent del navegador' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], HeartbeatDto.prototype, "user_agent", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'URL actual del usuario' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], HeartbeatDto.prototype, "url", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '¿El usuario tiene ad-blocker?' }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], HeartbeatDto.prototype, "has_adblock", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Cookie _fbp de Meta' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], HeartbeatDto.prototype, "fbp", void 0);
//# sourceMappingURL=tracking.dto.js.map