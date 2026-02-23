import {
  IsString,
  IsDateString,
  IsArray,
  IsOptional,
  IsEnum,
  ArrayMinSize,
  ArrayMaxSize,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

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
    example: ['id1', 'id2', 'id3', 'id4', 'id5', 'id6', 'id7', 'id8', 'id9', 'id10', 'id11', 'id12', 'id13', 'id14', 'id15'],
    description: 'Array of exactly 15 statement IDs',
  })
  @ApiPropertyOptional({
    enum: ['draft', 'scheduled', 'published'],
    default: 'draft',
    description: 'Initial status of the daily set',
  })
  @IsOptional()
  @IsEnum(['draft', 'scheduled', 'published'])
  status?: string;

  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(15)
  @ArrayMaxSize(15)
  questionIds: string[];
}
