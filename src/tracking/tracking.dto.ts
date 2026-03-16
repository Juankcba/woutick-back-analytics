import { IsString, IsOptional, IsBoolean, IsObject, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TrackEventDto {
  @ApiProperty({ description: 'IP del visitante', example: '185.140.33.38' })
  @IsString()
  ip!: string;

  @ApiPropertyOptional({ description: 'User-Agent del navegador' })
  @IsString()
  @IsOptional()
  user_agent?: string;

  @ApiPropertyOptional({ description: 'ID de sesión existente (para reutilizar)' })
  @IsString()
  @IsOptional()
  session_id?: string;

  @ApiProperty({ description: 'Nombre del evento', example: 'AddToCart' })
  @IsString()
  event_name!: string;

  @ApiPropertyOptional({ description: 'Event ID para deduplicación con Meta', example: 'atc_abc123_1234567890' })
  @IsString()
  @IsOptional()
  event_id?: string;

  @ApiPropertyOptional({ description: 'URL donde ocurrió el evento' })
  @IsString()
  @IsOptional()
  url?: string;

  @ApiPropertyOptional({ description: 'Slug del evento', example: 'festival-2026' })
  @IsString()
  @IsOptional()
  slug?: string;

  @ApiPropertyOptional({ description: 'Datos personalizados del evento', example: { value: 13.92, currency: 'EUR' } })
  @IsObject()
  @IsOptional()
  custom_data?: Record<string, any>;

  @ApiPropertyOptional({ example: 'facebook' })
  @IsString()
  @IsOptional()
  utm_source?: string;

  @ApiPropertyOptional({ example: 'cpc' })
  @IsString()
  @IsOptional()
  utm_medium?: string;

  @ApiPropertyOptional({ example: 'summer_sale' })
  @IsString()
  @IsOptional()
  utm_campaign?: string;

  @ApiPropertyOptional({ example: 'banner_ad_1' })
  @IsString()
  @IsOptional()
  utm_content?: string;

  @ApiPropertyOptional({ description: 'Facebook Click ID' })
  @IsString()
  @IsOptional()
  fbclid?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  referer?: string;

  @ApiPropertyOptional({ description: 'Slug del evento visitado', example: 'festival-2026' })
  @IsString()
  @IsOptional()
  event_slug?: string;

  @ApiPropertyOptional({ description: 'Cookie _fbp de Meta' })
  @IsString()
  @IsOptional()
  fbp?: string;

  @ApiPropertyOptional({ description: '¿El usuario tiene ad-blocker activo?' })
  @IsBoolean()
  @IsOptional()
  has_adblock?: boolean;

  @ApiPropertyOptional({ description: 'Entorno: dev, test, production', example: 'production' })
  @IsString()
  @IsOptional()
  environment?: string;
}

export class TrackRequestLogDto {
  @ApiProperty({ description: 'IP del visitante', example: '185.140.33.38' })
  @IsString()
  ip!: string;

  @ApiPropertyOptional({ description: 'ID de sesión existente' })
  @IsString()
  @IsOptional()
  session_id?: string;

  @ApiProperty({ description: 'Método HTTP', example: 'POST' })
  @IsString()
  method!: string;

  @ApiProperty({ description: 'Endpoint', example: '/order/' })
  @IsString()
  endpoint!: string;

  @ApiPropertyOptional({ description: 'Código de respuesta HTTP', example: 200 })
  @IsNumber()
  @IsOptional()
  status_code?: number;

  @ApiPropertyOptional({ description: 'Body del request' })
  @IsObject()
  @IsOptional()
  request_body?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Body de la respuesta' })
  @IsObject()
  @IsOptional()
  response_body?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Duración en ms', example: 150 })
  @IsNumber()
  @IsOptional()
  duration_ms?: number;
}

export class TrackMetaLogDto {
  @ApiPropertyOptional({ description: 'IP del visitante' })
  @IsString()
  @IsOptional()
  ip?: string;

  @ApiPropertyOptional({ description: 'ID de sesión existente' })
  @IsString()
  @IsOptional()
  session_id?: string;

  @ApiProperty({ description: 'Nombre del evento Meta', example: 'Purchase' })
  @IsString()
  event_name!: string;

  @ApiPropertyOptional({ description: 'Event ID para deduplicación' })
  @IsString()
  @IsOptional()
  event_id?: string;

  @ApiPropertyOptional({ description: 'ID del pixel Meta' })
  @IsString()
  @IsOptional()
  pixel_id?: string;

  @ApiProperty({ description: 'Ruta CAPI usada', example: '/api/meta/conversion' })
  @IsString()
  route!: string;

  @ApiProperty({ description: 'Payload completo enviado a Meta' })
  @IsObject()
  request_payload!: Record<string, any>;

  @ApiPropertyOptional({ description: 'Respuesta de Meta' })
  @IsObject()
  @IsOptional()
  response_payload?: Record<string, any>;

  @ApiPropertyOptional({ description: '¿El payload incluye fbp?' })
  @IsBoolean()
  @IsOptional()
  has_fbp?: boolean;

  @ApiPropertyOptional({ description: '¿El payload incluye fbc?' })
  @IsBoolean()
  @IsOptional()
  has_fbc?: boolean;

  @ApiPropertyOptional({ description: '¿El payload incluye email hash?' })
  @IsBoolean()
  @IsOptional()
  has_email?: boolean;

  @ApiPropertyOptional({ description: '¿El payload incluye phone hash?' })
  @IsBoolean()
  @IsOptional()
  has_phone?: boolean;

  @ApiPropertyOptional({ description: '¿El payload incluye first name hash?' })
  @IsBoolean()
  @IsOptional()
  has_fn?: boolean;

  @ApiPropertyOptional({ description: '¿El payload incluye last name hash?' })
  @IsBoolean()
  @IsOptional()
  has_ln?: boolean;

  @ApiPropertyOptional({ description: 'IP del cliente capturada server-side' })
  @IsString()
  @IsOptional()
  client_ip?: string;

  @ApiPropertyOptional({ description: '¿El usuario tenía ad-blocker?' })
  @IsBoolean()
  @IsOptional()
  has_adblock?: boolean;
}

export class HeartbeatDto {
  @ApiProperty({ description: 'IP del visitante', example: '185.140.33.38' })
  @IsString()
  ip!: string;

  @ApiPropertyOptional({ description: 'User-Agent del navegador' })
  @IsString()
  @IsOptional()
  user_agent?: string;

  @ApiPropertyOptional({ description: 'URL actual del usuario' })
  @IsString()
  @IsOptional()
  url?: string;

  @ApiPropertyOptional({ description: '¿El usuario tiene ad-blocker?' })
  @IsBoolean()
  @IsOptional()
  has_adblock?: boolean;

  @ApiPropertyOptional({ description: 'Cookie _fbp de Meta' })
  @IsString()
  @IsOptional()
  fbp?: string;

  @ApiPropertyOptional({ description: 'Entorno: dev, test, production', example: 'production' })
  @IsString()
  @IsOptional()
  environment?: string;
}
