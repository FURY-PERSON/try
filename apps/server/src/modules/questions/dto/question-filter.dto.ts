import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsIn } from 'class-validator';

export class QuestionFilterDto {
  @ApiPropertyOptional({
    description: 'Filter by language (ru, en, both)',
    example: 'en',
    enum: ['ru', 'en', 'both'],
  })
  @IsOptional()
  @IsIn(['ru', 'en', 'both'])
  language?: string;

  @ApiPropertyOptional({
    description: 'Filter by question type (anagram, compose_words, word_chain, word_search, guess_word)',
    example: 'anagram',
    enum: ['anagram', 'compose_words', 'word_chain', 'word_search', 'guess_word'],
  })
  @IsOptional()
  @IsIn(['anagram', 'compose_words', 'word_chain', 'word_search', 'guess_word'])
  type?: string;

  @ApiPropertyOptional({
    description: 'Filter by category ID',
    example: 'clxyz123abc',
  })
  @IsOptional()
  @IsString()
  categoryId?: string;
}
