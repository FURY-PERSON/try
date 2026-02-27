import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { QuestionQueryDto } from './dto/question-query.dto';
import { createPaginatedResponse } from '@/common/dto/pagination.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class AdminQuestionsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: QuestionQueryDto) {
    const { page, limit, status, language, isTrue, categoryId, difficulty, search, notInDailySet } =
      query;

    const where: Prisma.QuestionWhereInput = {};

    if (status) {
      where.status = status;
    }
    if (language) {
      where.language = language;
    }
    if (isTrue !== undefined) {
      where.isTrue = isTrue === 'true';
    }
    if (categoryId) {
      where.categoryId = categoryId;
    }
    if (difficulty !== undefined) {
      where.difficulty = difficulty;
    }
    if (search) {
      where.statement = { contains: search, mode: 'insensitive' };
    }
    if (notInDailySet === 'true') {
      where.dailySets = { none: {} };
    }

    const [questions, total] = await Promise.all([
      this.prisma.question.findMany({
        where,
        include: { category: true, categories: { include: { category: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.question.count({ where }),
    ]);

    return createPaginatedResponse(questions, total, query);
  }

  async findOne(id: string) {
    const question = await this.prisma.question.findUnique({
      where: { id },
      include: {
        category: true,
        categories: { include: { category: true } },
        dailySets: {
          include: { dailySet: true },
        },
      },
    });

    if (!question) {
      throw new NotFoundException(`Question with id "${id}" not found`);
    }

    return question;
  }

  async create(dto: CreateQuestionDto) {
    const category = await this.prisma.category.findUnique({
      where: { id: dto.categoryId },
    });

    if (!category) {
      throw new BadRequestException(
        `Category with id "${dto.categoryId}" not found`,
      );
    }

    // Check for duplicate statement
    const existing = await this.prisma.question.findFirst({
      where: { statement: dto.statement },
    });

    if (existing) {
      throw new ConflictException(
        `Question with this statement already exists (id: ${existing.id})`,
      );
    }

    const question = await this.prisma.question.create({
      data: {
        statement: dto.statement,
        isTrue: dto.isTrue,
        explanation: dto.explanation,
        source: dto.source,
        sourceUrl: dto.sourceUrl,
        language: dto.language,
        categoryId: dto.categoryId,
        difficulty: dto.difficulty,
        illustrationUrl: dto.illustrationUrl,
        illustrationPrompt: dto.illustrationPrompt,
        status: 'moderation',
      },
    });

    // Create QuestionCategory records (primary + additional)
    const allCategoryIds = new Set([
      dto.categoryId,
      ...(dto.categoryIds ?? []),
    ]);
    await this.prisma.questionCategory.createMany({
      data: [...allCategoryIds].map((categoryId) => ({
        questionId: question.id,
        categoryId,
      })),
      skipDuplicates: true,
    });

    return this.findOne(question.id);
  }

  async update(id: string, dto: UpdateQuestionDto) {
    const existing = await this.prisma.question.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Question with id "${id}" not found`);
    }

    if (dto.categoryId) {
      const category = await this.prisma.category.findUnique({
        where: { id: dto.categoryId },
      });
      if (!category) {
        throw new BadRequestException(
          `Category with id "${dto.categoryId}" not found`,
        );
      }
    }

    await this.prisma.question.update({
      where: { id },
      data: {
        statement: dto.statement,
        isTrue: dto.isTrue,
        explanation: dto.explanation,
        source: dto.source,
        sourceUrl: dto.sourceUrl,
        language: dto.language,
        categoryId: dto.categoryId,
        difficulty: dto.difficulty,
        illustrationUrl: dto.illustrationUrl,
        illustrationPrompt: dto.illustrationPrompt,
      },
    });

    // Update QuestionCategory records if categoryIds provided
    if (dto.categoryIds !== undefined) {
      await this.prisma.questionCategory.deleteMany({
        where: { questionId: id },
      });

      const primaryId = dto.categoryId ?? existing.categoryId;
      const allCategoryIds = new Set([primaryId, ...dto.categoryIds]);

      await this.prisma.questionCategory.createMany({
        data: [...allCategoryIds].map((categoryId) => ({
          questionId: id,
          categoryId,
        })),
        skipDuplicates: true,
      });
    }

    return this.findOne(id);
  }

  async remove(id: string) {
    const existing = await this.prisma.question.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Question with id "${id}" not found`);
    }

    await this.prisma.question.delete({ where: { id } });

    return { deleted: true };
  }

  async approve(id: string) {
    const existing = await this.prisma.question.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Question with id "${id}" not found`);
    }

    return this.prisma.question.update({
      where: { id },
      data: { status: 'approved' },
      include: { category: true },
    });
  }

  async reject(id: string) {
    const existing = await this.prisma.question.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Question with id "${id}" not found`);
    }

    return this.prisma.question.update({
      where: { id },
      data: { status: 'rejected' },
      include: { category: true },
    });
  }

  async bulkApprove(ids: string[]) {
    if (!ids || ids.length === 0) {
      throw new BadRequestException('No question IDs provided');
    }

    const result = await this.prisma.question.updateMany({
      where: {
        id: { in: ids },
      },
      data: { status: 'approved' },
    });

    return {
      approvedCount: result.count,
      requestedCount: ids.length,
    };
  }

  async bulkReject(ids: string[]) {
    if (!ids || ids.length === 0) {
      throw new BadRequestException('No question IDs provided');
    }

    const result = await this.prisma.question.updateMany({
      where: {
        id: { in: ids },
      },
      data: { status: 'rejected' },
    });

    return {
      rejectedCount: result.count,
      requestedCount: ids.length,
    };
  }

  async bulkDelete(ids: string[]) {
    if (!ids || ids.length === 0) {
      throw new BadRequestException('No question IDs provided');
    }

    const result = await this.prisma.question.deleteMany({
      where: {
        id: { in: ids },
      },
    });

    return {
      deletedCount: result.count,
      requestedCount: ids.length,
    };
  }
}
