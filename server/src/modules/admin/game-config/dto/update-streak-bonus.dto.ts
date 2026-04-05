import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsInt,
  Min,
  ValidateNested,
} from 'class-validator';

export class StreakBonusTierDto {
  @ApiProperty({ example: 5, description: 'Minimum streak to activate tier' })
  @IsInt()
  @Min(1)
  minStreak: number;

  @ApiProperty({ example: 10, description: 'Bonus percent for this tier' })
  @IsInt()
  @Min(0)
  bonusPercent: number;
}

export class UpdateStreakBonusDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  enabled: boolean;

  @ApiProperty({ type: [StreakBonusTierDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StreakBonusTierDto)
  tiers: StreakBonusTierDto[];
}
