import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { PrismaService } from '@/prisma/prisma.service';
import { UploadService } from '@/modules/admin/upload/upload.service';
import {
  getQuestionGenerationSystemPrompt,
  getQuestionGenerationUserPrompt,
} from './prompts/question-generation';

interface GenerateQuestionsParams {
  category: string;
  difficulty: number;
  language: string;
  count: number;
  additionalPrompt?: string;
}

interface GeneratedQuestion {
  type: string;
  questionData: {
    question: string;
    options: string[];
    correctAnswer: number;
  };
  fact: string;
  factSource: string;
  factSourceUrl?: string;
  difficulty: number;
}

interface GenerateIllustrationParams {
  questionId: string;
  style?: string;
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly anthropic: Anthropic;
  private readonly openai: OpenAI;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly uploadService: UploadService,
  ) {
    this.anthropic = new Anthropic({
      apiKey: this.configService.get<string>('ANTHROPIC_API_KEY', ''),
    });

    this.openai = new OpenAI({
      apiKey: this.configService.get<string>('OPENAI_API_KEY', ''),
    });
  }

  async generateQuestions(params: GenerateQuestionsParams) {
    const { category, difficulty, language, count, additionalPrompt } = params;

    const categoryRecord = await this.prisma.category.findFirst({
      where: {
        OR: [
          { slug: category },
          { name: category },
          { nameEn: category },
          { id: category },
        ],
      },
    });

    if (!categoryRecord) {
      throw new BadRequestException(`Category "${category}" not found`);
    }

    const systemPrompt = getQuestionGenerationSystemPrompt();
    const userPrompt = getQuestionGenerationUserPrompt({
      category: `${categoryRecord.name} (${categoryRecord.nameEn})`,
      difficulty,
      language,
      count,
      additionalPrompt,
    });

    let generatedQuestions: GeneratedQuestion[];

    try {
      const model = this.configService.get<string>(
        'ANTHROPIC_MODEL',
        'claude-sonnet-4-20250514',
      );

      const response = await this.anthropic.messages.create({
        model,
        max_tokens: 4096,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: userPrompt,
          },
        ],
      });

      const textContent = response.content.find(
        (block) => block.type === 'text',
      );

      if (!textContent || textContent.type !== 'text') {
        throw new Error('No text content in AI response');
      }

      const rawText = textContent.text.trim();

      const jsonMatch = rawText.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('No JSON array found in AI response');
      }

      generatedQuestions = JSON.parse(jsonMatch[0]) as GeneratedQuestion[];
    } catch (error) {
      this.logger.error(
        `Failed to generate questions via AI: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );

      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new InternalServerErrorException(
        `AI question generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }

    if (!Array.isArray(generatedQuestions) || generatedQuestions.length === 0) {
      throw new InternalServerErrorException(
        'AI returned empty or invalid question array',
      );
    }

    const createdQuestions = [];

    for (const q of generatedQuestions) {
      const factSource =
        q.factSource && q.factSource !== '' ? q.factSource : 'Requires verification';

      try {
        const created = await this.prisma.question.create({
          data: {
            type: q.type || 'multiple_choice',
            language,
            categoryId: categoryRecord.id,
            difficulty: q.difficulty || difficulty,
            questionData: q.questionData as Record<string, unknown>,
            fact: q.fact,
            factSource,
            factSourceUrl: q.factSourceUrl || null,
            status: 'moderation',
          },
          include: { category: true },
        });

        createdQuestions.push(created);
      } catch (error) {
        this.logger.warn(
          `Failed to save generated question: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
      }
    }

    return {
      generated: generatedQuestions.length,
      saved: createdQuestions.length,
      questions: createdQuestions,
    };
  }

  async generateIllustration(params: GenerateIllustrationParams) {
    const { questionId, style } = params;

    const question = await this.prisma.question.findUnique({
      where: { id: questionId },
      include: { category: true },
    });

    if (!question) {
      throw new BadRequestException(
        `Question with id "${questionId}" not found`,
      );
    }

    const questionData = question.questionData as Record<string, unknown>;
    const questionText =
      (questionData.question as string) || 'educational trivia question';

    const imageStyle = style || 'flat illustration, modern, colorful, educational';
    const imagePrompt = `Create a ${imageStyle} illustration for a trivia quiz question about: "${questionText}". Category: ${question.category.nameEn}. The illustration should be visually appealing, educational, and suitable for a mobile quiz app. Do not include any text or letters in the image.`;

    let imageBuffer: Buffer;

    try {
      const response = await this.openai.images.generate({
        model: this.configService.get<string>('OPENAI_IMAGE_MODEL', 'dall-e-3'),
        prompt: imagePrompt,
        n: 1,
        size: '1024x1024',
        response_format: 'b64_json',
      });

      const b64Data = response.data[0]?.b64_json;

      if (!b64Data) {
        throw new Error('No image data in DALL-E response');
      }

      imageBuffer = Buffer.from(b64Data, 'base64');
    } catch (error) {
      this.logger.error(
        `Failed to generate illustration via DALL-E: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      throw new InternalServerErrorException(
        `Image generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }

    let illustrationUrl: string;

    try {
      illustrationUrl = await this.uploadService.uploadImage(
        imageBuffer,
        'image/png',
        'illustrations',
      );
    } catch (error) {
      this.logger.error(
        `Failed to upload illustration to S3: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      throw new InternalServerErrorException(
        `Failed to upload generated illustration: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }

    const updatedQuestion = await this.prisma.question.update({
      where: { id: questionId },
      data: {
        illustrationUrl,
        illustrationPrompt: imagePrompt,
      },
      include: { category: true },
    });

    return {
      question: updatedQuestion,
      illustrationUrl,
    };
  }
}
