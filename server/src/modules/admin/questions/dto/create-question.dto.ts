import {
  IsString,
  IsInt,
  IsBoolean,
  IsOptional,
  IsArray,
  IsUrl,
  IsIn,
  Min,
  Max,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateQuestionDto {
  @ApiProperty({
    example: 'Великая Китайская стена видна из космоса невооружённым глазом',
    description: 'Statement text that the user will evaluate as fact or fake',
  })
  @IsString()
  @MinLength(10, { message: 'Statement must be at least 10 characters long' })
  statement: string;

  @ApiPropertyOptional({ description: 'Statement text in English' })
  @IsOptional()
  @IsString()
  statementEn?: string;

  @ApiProperty({
    example: false,
    description: 'Whether this statement is true (fact) or false (fake)',
  })
  @IsBoolean()
  isTrue: boolean;

  @ApiProperty({
    example: 'Это распространённый миф. Астронавты подтвердили, что стену невозможно увидеть из космоса без специального оборудования.',
    description: 'Explanation of why this statement is true or false',
  })
  @IsString()
  explanation: string;

  @ApiPropertyOptional({ description: 'Explanation text in English' })
  @IsOptional()
  @IsString()
  explanationEn?: string;

  @ApiProperty({
    example: 'NASA',
    description: 'Source of the information',
  })
  @IsString()
  source: string;

  @ApiPropertyOptional({ description: 'Source name in English' })
  @IsOptional()
  @IsString()
  sourceEn?: string;

  @ApiPropertyOptional({
    example: 'https://www.nasa.gov/...',
    description: 'URL to the source',
  })
  @IsOptional()
  @IsUrl({}, { message: 'sourceUrl must be a valid URL' })
  sourceUrl?: string;

  @ApiPropertyOptional({ description: 'URL to the English source' })
  @IsOptional()
  @IsUrl({}, { message: 'sourceUrlEn must be a valid URL' })
  sourceUrlEn?: string;

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

  @ApiPropertyOptional({
    description: 'Additional category IDs (multi-category)',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categoryIds?: string[];

  @ApiPropertyOptional({ description: 'URL of the illustration image' })
  @IsOptional()
  @IsString()
  illustrationUrl?: string;

  @ApiPropertyOptional({ description: 'Prompt used to generate the illustration' })
  @IsOptional()
  @IsString()
  illustrationPrompt?: string;

  @ApiPropertyOptional({
    description: 'Question status',
    enum: ['moderation', 'approved', 'rejected'],
  })
  @IsOptional()
  @IsIn(['moderation', 'approved', 'rejected'])
  status?: string;
}
