import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { DailySetsController } from './daily-sets.controller';
import { DailySetsService } from './daily-sets.service';

@Module({
  imports: [PrismaModule],
  controllers: [DailySetsController],
  providers: [DailySetsService],
  exports: [DailySetsService],
})
export class DailySetsModule {}
