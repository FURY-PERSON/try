import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsIn } from 'class-validator';

export class QuestionFilterDto {
  @ApiPropertyOptional({
    description: 'Filter by language (ru, en, both)',
    example: 'ru',
    enum: ['ru', 'en', 'both'],
  })
  @IsOptional()
  @IsIn(['ru', 'en', 'both'])
  language?: string;

  @ApiPropertyOptional({
    description: 'Filter by category ID',
    example: 'clxyz123abc',
  })
  @IsOptional()
  @IsString()
  categoryId?: string;
}
