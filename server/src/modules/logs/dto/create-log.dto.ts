import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsObject } from 'class-validator';

export class CreateLogDto {
  @ApiProperty({ description: 'Log type / category', example: 'ad_interstitial_failed' })
  @IsString()
  type: string;

  @ApiProperty({ description: 'Log message', example: 'Interstitial ad failed to load' })
  @IsString()
  message: string;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  @IsObject()
  meta?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Device ID' })
  @IsOptional()
  @IsString()
  deviceId?: string;
}
