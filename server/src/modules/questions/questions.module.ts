import { Module } from '@nestjs/common';
import { PrismaModule } from '@/prisma/prisma.module';
import { GameConfigModule } from '@/modules/game-config/game-config.module';
import { ShieldsModule } from '@/modules/shields/shields.module';
import { QuestionsController } from './questions.controller';
import { QuestionsService } from './questions.service';

@Module({
  imports: [PrismaModule, GameConfigModule, ShieldsModule],
  controllers: [QuestionsController],
  providers: [QuestionsService],
  exports: [QuestionsService],
})
export class QuestionsModule {}
