import { IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RewardShieldDto {
  @ApiProperty({ description: 'Source of reward', enum: ['rewarded_video'] })
  @IsIn(['rewarded_video'])
  source: string;
}
