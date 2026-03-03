import { IsString, MinLength, IsOptional, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SimilarQueryDto {
  @ApiProperty({ description: 'Text to search for similar statements', minLength: 10 })
  @IsString()
  @MinLength(10)
  q: string;

  @ApiPropertyOptional({ description: 'Max results to return', default: 10, maximum: 50 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  @Type(() => Number)
  limit?: number = 10;

  @ApiPropertyOptional({ description: 'Question ID to exclude (for edit mode)' })
  @IsOptional()
  @IsString()
  excludeId?: string;
}
