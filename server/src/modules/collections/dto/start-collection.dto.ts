import { IsString, IsOptional, IsEnum, IsInt, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class StartCollectionDto {
  @ApiProperty({
    enum: ['category', 'difficulty', 'collection'],
    description: 'Type of collection to start',
  })
  @IsEnum(['category', 'difficulty', 'collection'])
  type: string;

  @ApiPropertyOptional({ description: 'Category ID (required when type=category)' })
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional({
    enum: ['easy', 'medium', 'hard'],
    description: 'Difficulty level (required when type=difficulty)',
  })
  @IsOptional()
  @IsEnum(['easy', 'medium', 'hard'])
  difficulty?: string;

  @ApiPropertyOptional({ description: 'Collection ID (required when type=collection)' })
  @IsOptional()
  @IsString()
  collectionId?: string;

  @ApiPropertyOptional({ default: 10, description: 'Number of questions', minimum: 5, maximum: 20 })
  @IsOptional()
  @IsInt()
  @Min(5)
  @Max(20)
  count?: number;
}
