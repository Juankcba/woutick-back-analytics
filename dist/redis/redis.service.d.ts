import { OnModuleDestroy } from '@nestjs/common';
export declare class RedisService implements OnModuleDestroy {
    private client;
    constructor();
    onModuleDestroy(): Promise<void>;
    markOnline(ip: string): Promise<void>;
    getOnlineCount(): Promise<number>;
    getOnlineUsers(): Promise<string[]>;
}
