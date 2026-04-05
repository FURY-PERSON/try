import { Module } from '@nestjs/common';
import { ShieldsService } from './shields.service';
import { ShieldsController } from './shields.controller';

@Module({
  controllers: [ShieldsController],
  providers: [ShieldsService],
  exports: [ShieldsService],
})
export class ShieldsModule {}
