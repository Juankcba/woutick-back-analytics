import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { TrackingModule } from './tracking/tracking.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { ConfigModule } from './config/config.module';

@Module({
  imports: [
    PrismaModule,
    RedisModule,
    TrackingModule,
    AnalyticsModule,
    ConfigModule,
  ],
})
export class AppModule {}
