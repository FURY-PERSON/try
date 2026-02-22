import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import {
  IsString,
  IsInt,
  IsOptional,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AdminJwtGuard } from '@/modules/admin/auth/admin-jwt.guard';
import { AiService } from './ai.service';

export class GenerateQuestionsDto {
  @ApiProperty({
    example: 'science',
    description: 'Category slug, name, or ID',
  })
  @IsString()
  category: string;

  @ApiProperty({
    example: 3,
    minimum: 1,
    maximum: 5,
    description: 'Difficulty level (1-5)',
  })
  @IsInt()
  @Min(1)
  @Max(5)
  difficulty: number;

  @ApiProperty({
    example: 'ru',
    description: 'Language for generated statements (ru, en)',
  })
  @IsString()
  language: string;

  @ApiProperty({
    example: 10,
    minimum: 1,
    maximum: 20,
    description: 'Number of statements to generate (approx. 50% facts, 50% fakes)',
  })
  @IsInt()
  @Min(1)
  @Max(20)
  count: number;

  @ApiPropertyOptional({
    example: 'Focus on space exploration facts',
    description: 'Additional prompt instructions for the AI',
  })
  @IsOptional()
  @IsString()
  additionalPrompt?: string;
}

export class GenerateIllustrationDto {
  @ApiProperty({ description: 'Question ID to generate illustration for' })
  @IsString()
  questionId: string;

  @ApiPropertyOptional({
    example: 'watercolor, soft, educational',
    description: 'Illustration style description',
  })
  @IsOptional()
  @IsString()
  style?: string;
}

@ApiTags('admin/ai')
@ApiBearerAuth()
@UseGuards(AdminJwtGuard)
@Controller('admin/ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('generate-questions')
  @ApiOperation({
    summary: 'Generate fact-or-fake statements via AI',
    description:
      'Uses Anthropic Claude to generate statements (facts and fakes) with explanations and sources. All generated statements are saved with status "moderation".',
  })
  @ApiResponse({
    status: 201,
    description: 'Statements generated and saved',
    schema: {
      type: 'object',
      properties: {
        generated: { type: 'number', example: 10 },
        saved: { type: 'number', example: 10 },
        questions: { type: 'array', items: { type: 'object' } },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid parameters or category not found' })
  @ApiResponse({ status: 500, description: 'AI generation failed' })
  async generateQuestions(@Body() dto: GenerateQuestionsDto) {
    return this.aiService.generateQuestions(dto);
  }

  @Post('generate-illustration')
  @ApiOperation({
    summary: 'Generate an illustration for a statement via DALL-E',
    description:
      'Uses OpenAI DALL-E to generate an illustration image, uploads it to S3, and updates the question.',
  })
  @ApiResponse({
    status: 201,
    description: 'Illustration generated, uploaded, and question updated',
    schema: {
      type: 'object',
      properties: {
        question: { type: 'object' },
        illustrationUrl: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Question not found' })
  @ApiResponse({ status: 500, description: 'Image generation or upload failed' })
  async generateIllustration(@Body() dto: GenerateIllustrationDto) {
    return this.aiService.generateIllustration(dto);
  }
}
