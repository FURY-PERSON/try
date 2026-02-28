import {
  IsString,
  IsOptional,
  IsEnum,
  IsArray,
  IsInt,
  Min,
  Max,
  ArrayMinSize,
  IsDateString,
  IsBoolean,
  ValidateNested,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateCollectionItemDto {
  @ApiProperty({ example: 'Человек использует только 10% мозга', description: 'Question statement' })
  @IsString()
  @MinLength(5)
  statement: string;

  @ApiProperty({ example: false, description: 'True if the statement is correct' })
  @IsBoolean()
  isTrue: boolean;

  @ApiProperty({ example: 'На самом деле мозг задействован полностью', description: 'Explanation' })
  @IsString()
  @MinLength(5)
  explanation: string;

  @ApiPropertyOptional({ example: 'Wikipedia', description: 'Source name' })
  @IsOptional()
  @IsString()
  source?: string;

  @ApiPropertyOptional({ description: 'Source URL' })
  @IsOptional()
  @IsString()
  sourceUrl?: string;

  @ApiPropertyOptional({ example: 3, minimum: 1, maximum: 5, default: 3 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  difficulty?: number;

  @ApiPropertyOptional({ enum: ['ru', 'en'], default: 'ru' })
  @IsOptional()
  @IsEnum(['ru', 'en'])
  language?: string;

  @ApiPropertyOptional({ default: 0, description: 'Sort order within collection' })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

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

  @ApiProperty({ description: 'Array of questions for this collection', type: [CreateCollectionItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateCollectionItemDto)
  items: CreateCollectionItemDto[];

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
