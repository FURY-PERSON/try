import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from '../../prisma/prisma.module';
import { DailySetPublisherService } from './daily-set-publisher.service';

@Module({
  imports: [PrismaModule, ScheduleModule],
  providers: [DailySetPublisherService],
})
export class TasksModule {}
