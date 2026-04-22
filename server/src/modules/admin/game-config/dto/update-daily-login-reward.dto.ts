import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsInt,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

export class DailyLoginRewardEntryDto {
  @ApiProperty({ example: 1, description: 'Номер дня стрика (начиная с 1)' })
  @IsInt()
  @Min(1)
  @Max(365)
  day: number;

  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(0)
  shields: number;

  @ApiProperty({ example: 0 })
  @IsInt()
  @Min(0)
  streak: number;
}

export class UpdateDailyLoginRewardDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  isEnabled: boolean;

  @ApiProperty({ example: 10 })
  @IsInt()
  @Min(1)
  @Max(100)
  capShields: number;

  @ApiProperty({ example: 10 })
  @IsInt()
  @Min(0)
  @Max(100)
  capStreak: number;

  @ApiProperty({ type: [DailyLoginRewardEntryDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => DailyLoginRewardEntryDto)
  rewards: DailyLoginRewardEntryDto[];
}
