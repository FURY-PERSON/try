import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { GameConfigModule } from '@/modules/game-config/game-config.module';
import { ShieldsModule } from '@/modules/shields/shields.module';
import { DailySetsController } from './daily-sets.controller';
import { DailySetsService } from './daily-sets.service';

@Module({
  imports: [PrismaModule, GameConfigModule, ShieldsModule],
  controllers: [DailySetsController],
  providers: [DailySetsService],
  exports: [DailySetsService],
})
export class DailySetsModule {}
