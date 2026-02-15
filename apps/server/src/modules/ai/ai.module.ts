import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { AdminModule } from '@/modules/admin/admin.module';

@Module({
  imports: [ConfigModule, AdminModule],
  controllers: [AiController],
  providers: [AiService],
})
export class AiModule {}
