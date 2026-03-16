export declare class TrackEventDto {
    ip?: string;
    user_agent?: string;
    session_id?: string;
    event_name: string;
    event_id?: string;
    url?: string;
    slug?: string;
    custom_data?: Record<string, any>;
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    utm_content?: string;
    fbclid?: string;
    referer?: string;
    event_slug?: string;
    fbp?: string;
    has_adblock?: boolean;
    cookie_consent?: boolean;
    name?: string;
    phone?: string;
    email?: string;
    environment?: string;
}
export declare class TrackRequestLogDto {
    ip?: string;
    session_id?: string;
    method: string;
    endpoint: string;
    status_code?: number;
    request_body?: Record<string, any>;
    response_body?: Record<string, any>;
    duration_ms?: number;
}
export declare class TrackMetaLogDto {
    ip?: string;
    session_id?: string;
    event_name: string;
    event_id?: string;
    pixel_id?: string;
    route: string;
    request_payload: Record<string, any>;
    response_payload?: Record<string, any>;
    response_status?: number;
    has_fbp?: boolean;
    has_fbc?: boolean;
    has_email?: boolean;
    has_phone?: boolean;
    has_fn?: boolean;
    has_ln?: boolean;
    client_ip?: string;
    has_adblock?: boolean;
}
export declare class HeartbeatDto {
    ip?: string;
    user_agent?: string;
    url?: string;
    has_adblock?: boolean;
    cookie_consent?: boolean;
    fbp?: string;
    environment?: string;
}
