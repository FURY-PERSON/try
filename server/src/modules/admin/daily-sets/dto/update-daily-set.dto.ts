import { IsString, IsDateString, IsArray, IsOptional, ArrayMinSize, ArrayMaxSize } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateDailySetDto {
  @ApiPropertyOptional({
    example: '2026-03-01',
    description: 'Date for the daily set (YYYY-MM-DD)',
  })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiPropertyOptional({ example: 'Удивительная наука', description: 'Theme in Russian' })
  @IsOptional()
  @IsString()
  theme?: string;

  @ApiPropertyOptional({ example: 'Amazing Science', description: 'Theme in English' })
  @IsOptional()
  @IsString()
  themeEn?: string;

  @ApiPropertyOptional({
    example: ['cuid1', 'cuid2', 'cuid3', 'cuid4', 'cuid5'],
    description: 'Array of exactly 5 question IDs',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(5)
  @ArrayMaxSize(5)
  questionIds?: string[];
}
