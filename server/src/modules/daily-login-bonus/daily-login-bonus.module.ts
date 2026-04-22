import { Module } from '@nestjs/common';
import { PrismaModule } from '@/prisma/prisma.module';
import { DailyLoginBonusController } from './daily-login-bonus.controller';
import { DailyLoginBonusService } from './daily-login-bonus.service';

@Module({
  imports: [PrismaModule],
  controllers: [DailyLoginBonusController],
  providers: [DailyLoginBonusService],
  exports: [DailyLoginBonusService],
})
export class DailyLoginBonusModule {}
