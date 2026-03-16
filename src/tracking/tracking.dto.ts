import { IsString, IsOptional, IsBoolean, IsObject } from 'class-validator';

export class TrackEventDto {
  @IsString()
  ip!: string;

  @IsString()
  @IsOptional()
  user_agent?: string;

  @IsString()
  @IsOptional()
  session_id?: string;

  @IsString()
  event_name!: string;

  @IsString()
  @IsOptional()
  event_id?: string;

  @IsString()
  @IsOptional()
  url?: string;

  @IsString()
  @IsOptional()
  slug?: string;

  @IsObject()
  @IsOptional()
  custom_data?: Record<string, any>;

  // UTM / campaign data (for session creation)
  @IsString()
  @IsOptional()
  utm_source?: string;

  @IsString()
  @IsOptional()
  utm_medium?: string;

  @IsString()
  @IsOptional()
  utm_campaign?: string;

  @IsString()
  @IsOptional()
  utm_content?: string;

  @IsString()
  @IsOptional()
  fbclid?: string;

  @IsString()
  @IsOptional()
  referer?: string;

  @IsString()
  @IsOptional()
  event_slug?: string;

  @IsString()
  @IsOptional()
  fbp?: string;

  @IsBoolean()
  @IsOptional()
  has_adblock?: boolean;
}

export class TrackRequestLogDto {
  @IsString()
  ip!: string;

  @IsString()
  @IsOptional()
  session_id?: string;

  @IsString()
  method!: string;

  @IsString()
  endpoint!: string;

  @IsOptional()
  status_code?: number;

  @IsObject()
  @IsOptional()
  request_body?: Record<string, any>;

  @IsObject()
  @IsOptional()
  response_body?: Record<string, any>;

  @IsOptional()
  duration_ms?: number;
}

export class TrackMetaLogDto {
  @IsString()
  @IsOptional()
  ip?: string;

  @IsString()
  @IsOptional()
  session_id?: string;

  @IsString()
  event_name!: string;

  @IsString()
  @IsOptional()
  event_id?: string;

  @IsString()
  @IsOptional()
  pixel_id?: string;

  @IsString()
  route!: string;

  @IsObject()
  request_payload!: Record<string, any>;

  @IsObject()
  @IsOptional()
  response_payload?: Record<string, any>;

  @IsBoolean()
  @IsOptional()
  has_fbp?: boolean;

  @IsBoolean()
  @IsOptional()
  has_fbc?: boolean;

  @IsBoolean()
  @IsOptional()
  has_email?: boolean;

  @IsBoolean()
  @IsOptional()
  has_phone?: boolean;

  @IsBoolean()
  @IsOptional()
  has_fn?: boolean;

  @IsBoolean()
  @IsOptional()
  has_ln?: boolean;

  @IsString()
  @IsOptional()
  client_ip?: string;

  @IsBoolean()
  @IsOptional()
  has_adblock?: boolean;
}

export class HeartbeatDto {
  @IsString()
  ip!: string;

  @IsString()
  @IsOptional()
  user_agent?: string;

  @IsString()
  @IsOptional()
  url?: string;

  @IsBoolean()
  @IsOptional()
  has_adblock?: boolean;

  @IsString()
  @IsOptional()
  fbp?: string;
}
