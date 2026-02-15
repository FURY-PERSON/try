import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
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
import { AdminModule } from './modules/admin/admin.module';
import { AiModule } from './modules/ai/ai.module';

@Module({
  imports: [
    // Configuration - globally available
    ConfigModule.forRoot({ isGlobal: true }),

    // Rate limiting - 100 requests per 60 seconds
    ThrottlerModule.forRoot({
      throttlers: [{ ttl: 60000, limit: 100 }],
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
