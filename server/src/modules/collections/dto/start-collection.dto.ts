import { IsString, IsOptional, IsEnum, IsInt, IsBoolean, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class StartCollectionDto {
  @ApiProperty({
    enum: ['category', 'difficulty', 'collection', 'random'],
    description: 'Type of collection to start',
  })
  @IsEnum(['category', 'difficulty', 'collection', 'random'])
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

  @ApiPropertyOptional({ default: 10, description: 'Number of questions', minimum: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  count?: number;

  @ApiPropertyOptional({ description: 'Replay mode — skip stats recording' })
  @IsOptional()
  @IsBoolean()
  replay?: boolean;
}
