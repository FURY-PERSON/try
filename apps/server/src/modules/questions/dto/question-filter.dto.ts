import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class QuestionFilterDto {
  @ApiPropertyOptional({
    description: 'Filter by language (ru, en, both)',
    example: 'en',
  })
  @IsOptional()
  @IsString()
  language?: string;

  @ApiPropertyOptional({
    description: 'Filter by question type (anagram, compose_words, word_chain, word_search, guess_word)',
    example: 'anagram',
  })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({
    description: 'Filter by category ID',
    example: 'clxyz123abc',
  })
  @IsOptional()
  @IsString()
  categoryId?: string;
}
