import { IsOptional, IsString, IsInt, IsIn, Min, Max } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from '@/common/dto/pagination.dto';

export class QuestionQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by status (moderation, approved, rejected)',
  })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'Filter by language (ru, en)' })
  @IsOptional()
  @IsString()
  language?: string;

  @ApiPropertyOptional({
    description: 'Filter by isTrue (true = facts only, false = fakes only)',
  })
  @IsOptional()
  @IsIn(['true', 'false'])
  isTrue?: string;

  @ApiPropertyOptional({ description: 'Filter by category ID' })
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional({
    description: 'Filter by difficulty level (1-5)',
    minimum: 1,
    maximum: 5,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  @Type(() => Number)
  difficulty?: number;

  @ApiPropertyOptional({ description: 'Search by statement text' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter questions not used in any daily set (true/false)',
  })
  @IsOptional()
  @IsIn(['true', 'false'])
  notInDailySet?: string;
}
