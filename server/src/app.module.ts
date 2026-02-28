import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './health/health.module';
import { UsersModule } from './modules/users/users.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { QuestionsModule } from './modules/questions/questions.module';
import { DailySetsModule } from './modules/daily-sets/daily-sets.module';
import { LeaderboardModule } from './modules/leaderboard/leaderboard.module';
import { CollectionsModule } from './modules/collections/collections.module';
import { HomeModule } from './modules/home/home.module';
import { ReferenceModule } from './modules/reference/reference.module';
import { AdminModule } from './modules/admin/admin.module';
import { AiModule } from './modules/ai/ai.module';

@Module({
  imports: [
    // Configuration - globally available
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [`.env.${process.env.NODE_ENV || 'development'}`, '.env'],
    }),

    // Rate limiting - configurable via THROTTLE_TTL and THROTTLE_LIMIT env vars
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        throttlers: [
          {
            ttl: (config.get<number>('THROTTLE_TTL') || 60) * 1000,
            limit: config.get<number>('THROTTLE_LIMIT') || 100,
          },
        ],
      }),
    }),

    // Task scheduling
    ScheduleModule.forRoot(),

    // Database
    PrismaModule,

    // Core modules
    HealthModule,

    // Feature modules
    UsersModule,
    CategoriesModule,
    QuestionsModule,
    DailySetsModule,
    LeaderboardModule,
    CollectionsModule,
    HomeModule,
    ReferenceModule,
    AdminModule,
    AiModule,
  ],
  providers: [
    // Apply throttler guard globally
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
