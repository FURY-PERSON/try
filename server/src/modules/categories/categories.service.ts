import { Injectable, NotFoundException } from '@nestjs/common';
import { Category } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { getExcludedQuestionIds } from '@/modules/shared/anti-repeat';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAllActive(): Promise<Category[]> {
    return this.prisma.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async findById(id: string, userId: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
    });

    if (!category || !category.isActive) {
      throw new NotFoundException('Category not found');
    }

    const excludedIds = await getExcludedQuestionIds(this.prisma, userId);

    const categoryWhere = {
      OR: [
        { categoryId: id },
        { categories: { some: { categoryId: id } } },
      ],
      status: 'approved' as const,
    };

    const [totalCount, availableCount, lastResult] = await Promise.all([
      this.prisma.question.count({ where: categoryWhere }),
      this.prisma.question.count({
        where: {
          ...categoryWhere,
          ...(excludedIds.length > 0
            ? { NOT: { id: { in: excludedIds } } }
            : {}),
        },
      }),
      this.prisma.userCollectionProgress.findFirst({
        where: {
          userId,
          collectionType: 'category',
          referenceId: id,
        },
        orderBy: { completedAt: 'desc' },
        select: {
          correctAnswers: true,
          totalQuestions: true,
          completedAt: true,
        },
      }),
    ]);

    return {
      ...category,
      totalCount,
      availableCount,
      lastResult,
    };
  }
}
