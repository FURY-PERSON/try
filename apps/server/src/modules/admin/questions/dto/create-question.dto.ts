import {
  IsString,
  IsInt,
  IsOptional,
  IsObject,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateQuestionDto {
  @ApiProperty({ example: 'multiple_choice', description: 'Question type' })
  @IsString()
  type: string;

  @ApiProperty({ example: 'ru', description: 'Language code' })
  @IsString()
  language: string;

  @ApiProperty({ description: 'Category ID' })
  @IsString()
  categoryId: string;

  @ApiProperty({ example: 3, minimum: 1, maximum: 5, description: 'Difficulty level 1-5' })
  @IsInt()
  @Min(1)
  @Max(5)
  difficulty: number;

  @ApiProperty({
    description: 'Question data as JSON (question text, options, correct answer, etc.)',
    example: {
      question: 'What is the capital of France?',
      options: ['London', 'Berlin', 'Paris', 'Madrid'],
      correctAnswer: 2,
    },
  })
  @IsObject()
  questionData: Record<string, unknown>;

  @ApiProperty({ description: 'Interesting fact related to the question' })
  @IsString()
  fact: string;

  @ApiProperty({ description: 'Source of the fact (Wikipedia, book, encyclopedia)' })
  @IsString()
  factSource: string;

  @ApiPropertyOptional({ description: 'URL to the fact source' })
  @IsOptional()
  @IsString()
  factSourceUrl?: string;

  @ApiPropertyOptional({ description: 'URL of the illustration image' })
  @IsOptional()
  @IsString()
  illustrationUrl?: string;

  @ApiPropertyOptional({ description: 'Prompt used to generate the illustration' })
  @IsOptional()
  @IsString()
  illustrationPrompt?: string;
}
