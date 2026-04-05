import { Module } from '@nestjs/common';
import { PrismaModule } from '@/prisma/prisma.module';
import { GameConfigModule } from '@/modules/game-config/game-config.module';
import { QuestionsController } from './questions.controller';
import { QuestionsService } from './questions.service';

@Module({
  imports: [PrismaModule, GameConfigModule],
  controllers: [QuestionsController],
  providers: [QuestionsService],
  exports: [QuestionsService],
})
export class QuestionsModule {}
