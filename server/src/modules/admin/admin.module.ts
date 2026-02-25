import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { AdminAuthController } from './auth/admin-auth.controller';
import { AdminAuthService } from './auth/admin-auth.service';
import { AdminJwtStrategy } from './auth/strategies/jwt.strategy';

import { AdminQuestionsController } from './questions/admin-questions.controller';
import { AdminQuestionsService } from './questions/admin-questions.service';

import { AdminDailySetsController } from './daily-sets/admin-daily-sets.controller';
import { AdminDailySetsService } from './daily-sets/admin-daily-sets.service';

import { AdminCategoriesController } from './categories/admin-categories.controller';
import { AdminCategoriesService } from './categories/admin-categories.service';

import { AdminStatsController } from './stats/admin-stats.controller';
import { AdminStatsService } from './stats/admin-stats.service';

import { AdminCollectionsController } from './collections/admin-collections.controller';
import { AdminCollectionsService } from './collections/admin-collections.service';

import { AdminReferenceController } from './reference/admin-reference.controller';
import { AdminReferenceService } from './reference/admin-reference.service';

import { UploadController } from './upload/upload.controller';
import { UploadService } from './upload/upload.service';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'admin-jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET', 'super-secret-key'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_ACCESS_EXPIRES', '15m'),
        },
      }),
    }),
  ],
  controllers: [
    AdminAuthController,
    AdminQuestionsController,
    AdminDailySetsController,
    AdminCategoriesController,
    AdminStatsController,
    AdminCollectionsController,
    AdminReferenceController,
    UploadController,
  ],
  providers: [
    AdminAuthService,
    AdminJwtStrategy,
    AdminQuestionsService,
    AdminDailySetsService,
    AdminCategoriesService,
    AdminStatsService,
    AdminCollectionsService,
    AdminReferenceService,
    UploadService,
  ],
  exports: [UploadService],
})
export class AdminModule {}
