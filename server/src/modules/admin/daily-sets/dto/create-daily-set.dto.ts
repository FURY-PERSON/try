import {
  IsString,
  IsDateString,
  IsArray,
  ArrayMinSize,
  ArrayMaxSize,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateDailySetDto {
  @ApiProperty({
    example: '2026-03-01',
    description: 'Date for the daily set (YYYY-MM-DD)',
  })
  @IsDateString()
  date: string;

  @ApiProperty({ example: 'Удивительная наука', description: 'Theme in Russian' })
  @IsString()
  theme: string;

  @ApiProperty({ example: 'Amazing Science', description: 'Theme in English' })
  @IsString()
  themeEn: string;

  @ApiProperty({
    example: ['cuid1', 'cuid2', 'cuid3', 'cuid4', 'cuid5'],
    description: 'Array of exactly 5 question IDs',
  })
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(5)
  @ArrayMaxSize(5)
  questionIds: string[];
}
