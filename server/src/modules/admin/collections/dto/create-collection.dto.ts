import {
  IsString,
  IsOptional,
  IsEnum,
  IsArray,
  IsInt,
  Min,
  ArrayMinSize,
  IsDateString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCollectionDto {
  @ApiProperty({ example: 'Мифы о здоровье', description: 'Title in Russian' })
  @IsString()
  title: string;

  @ApiProperty({ example: 'Health Myths', description: 'Title in English' })
  @IsString()
  titleEn: string;

  @ApiPropertyOptional({ description: 'Description in Russian' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Description in English' })
  @IsOptional()
  @IsString()
  descriptionEn?: string;

  @ApiPropertyOptional({ example: '💊', description: 'Icon emoji' })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiPropertyOptional({ description: 'Cover image URL' })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional({ enum: ['featured', 'seasonal', 'thematic'], default: 'thematic' })
  @IsOptional()
  @IsEnum(['featured', 'seasonal', 'thematic'])
  type?: string;

  @ApiProperty({ description: 'Array of question IDs', type: [String] })
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  questionIds: string[];

  @ApiPropertyOptional({ description: 'Start date (ISO string)' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date (ISO string)' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ default: 0, description: 'Sort order' })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}
