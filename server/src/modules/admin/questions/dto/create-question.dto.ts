import {
  IsString,
  IsInt,
  IsBoolean,
  IsOptional,
  IsArray,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateQuestionDto {
  @ApiProperty({
    example: 'Великая Китайская стена видна из космоса невооружённым глазом',
    description: 'Statement text that the user will evaluate as fact or fake',
  })
  @IsString()
  statement: string;

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

  @ApiProperty({
    example: 'NASA',
    description: 'Source of the information',
  })
  @IsString()
  source: string;

  @ApiPropertyOptional({
    example: 'https://www.nasa.gov/...',
    description: 'URL to the source',
  })
  @IsOptional()
  @IsString()
  sourceUrl?: string;

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
}
