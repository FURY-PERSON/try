import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { QuestionQueryDto } from './dto/question-query.dto';
import { SimilarQueryDto } from './dto/similar-query.dto';
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
      // TODO: Add PostgreSQL full-text search index (GIN/tsvector) for better performance on large datasets
      where.statement = { contains: search, mode: 'insensitive' };
    }
    if (notInDailySet === 'true') {
      where.dailySets = { none: {} };
    }

    const [questions, total] = await Promise.all([
      this.prisma.question.findMany({
        where,
        include: {
          category: { select: { id: true, name: true, nameEn: true, icon: true } },
          categories: { include: { category: { select: { id: true, name: true, nameEn: true, icon: true } } } },
        },
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

    const question = await this.prisma.question.create({
      data: {
        statement: dto.statement,
        statementEn: dto.statementEn ?? '',
        isTrue: dto.isTrue,
        explanation: dto.explanation,
        explanationEn: dto.explanationEn ?? '',
        source: dto.source,
        sourceEn: dto.sourceEn ?? '',
        sourceUrl: dto.sourceUrl,
        sourceUrlEn: dto.sourceUrlEn,
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
        statementEn: dto.statementEn,
        isTrue: dto.isTrue,
        explanation: dto.explanation,
        explanationEn: dto.explanationEn,
        source: dto.source,
        sourceEn: dto.sourceEn,
        sourceUrl: dto.sourceUrl,
        sourceUrlEn: dto.sourceUrlEn,
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

    await this.prisma.$transaction([
      this.prisma.dailySetQuestion.deleteMany({ where: { questionId: id } }),
      this.prisma.userQuestionHistory.deleteMany({ where: { questionId: id } }),
      this.prisma.questionCategory.deleteMany({ where: { questionId: id } }),
      this.prisma.question.delete({ where: { id } }),
    ]);

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

  async findSimilar(dto: SimilarQueryDto) {
    const { q, limit = 10, excludeId } = dto;

    const excludeQuestion = excludeId
      ? Prisma.sql`AND q."id" != ${excludeId}`
      : Prisma.empty;

    const excludeCollectionItem = excludeId
      ? Prisma.sql`AND ci."id" != ${excludeId}`
      : Prisma.empty;

    const results = await this.prisma.$queryRaw<
      {
        id: string;
        statement: string;
        similarity: number;
        type: string;
        status: string | null;
        categoryName: string | null;
        categoryIcon: string | null;
      }[]
    >(Prisma.sql`
      SELECT * FROM (
        SELECT
          q."id",
          q."statement",
          similarity(q."statement", ${q}) AS similarity,
          'question' AS type,
          q."status",
          c."name" AS "categoryName",
          c."icon" AS "categoryIcon"
        FROM "Question" q
        LEFT JOIN "Category" c ON c."id" = q."categoryId"
        WHERE q."statement" % ${q}
        ${excludeQuestion}

        UNION ALL

        SELECT
          ci."id",
          ci."statement",
          similarity(ci."statement", ${q}) AS similarity,
          'collection' AS type,
          NULL AS "status",
          col."title" AS "categoryName",
          col."icon" AS "categoryIcon"
        FROM "CollectionItem" ci
        LEFT JOIN "Collection" col ON col."id" = ci."collectionId"
        WHERE ci."statement" % ${q}
        ${excludeCollectionItem}
      ) AS combined
      ORDER BY similarity DESC
      LIMIT ${limit}
    `);

    return results.map((r) => ({
      ...r,
      similarity: Math.round(Number(r.similarity) * 100),
    }));
  }
}
