import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { getExcludedQuestionIds, getAllAnsweredQuestionIds } from '@/modules/shared/anti-repeat';

const WEEKLY_LOCKOUT_DAYS = 7;

@Injectable()
export class HomeService {
  constructor(private readonly prisma: PrismaService) {}

  async getFeed(userId: string) {
    // Load anti-repeat data once, shared across categories and difficulty
    const [excludedIds, answeredIds] = await Promise.all([
      getExcludedQuestionIds(this.prisma, userId),
      getAllAnsweredQuestionIds(this.prisma, userId),
    ]);
    const answeredSet = new Set(answeredIds);

    const [daily, categories, collections, difficultyProgress, user] = await Promise.all([
      this.getDailyStatus(userId),
      this.getCategoriesWithCount(excludedIds, answeredSet),
      this.getPublishedCollections(userId),
      this.getDifficultyProgress(answeredSet),
      this.prisma.user.findUnique({
        where: { id: userId },
        select: { currentStreak: true, nickname: true, avatarEmoji: true },
      }),
    ]);

    return {
      daily,
      categories,
      collections,
      difficultyProgress,
      userProgress: {
        dailyCompleted: daily.isLocked,
        streak: user?.currentStreak ?? 0,
        nickname: user?.nickname ?? null,
        avatarEmoji: user?.avatarEmoji ?? null,
      },
    };
  }

  private async getDailyStatus(userId: string) {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const dailySet = await this.prisma.dailySet.findUnique({
      where: { date: today },
      select: {
        id: true,
        date: true,
        theme: true,
        themeEn: true,
        status: true,
      },
    });

    if (!dailySet || dailySet.status !== 'published') {
      return {
        set: null,
        isLocked: false,
        unlocksAt: null,
        lastResult: null,
      };
    }

    const entry = await this.prisma.leaderboardEntry.findUnique({
      where: {
        userId_dailySetId: { userId, dailySetId: dailySet.id },
      },
      select: {
        score: true,
        correctAnswers: true,
        totalTimeSeconds: true,
        createdAt: true,
      },
    });

    if (entry) {
      const unlocksAt = new Date(entry.createdAt);
      unlocksAt.setDate(unlocksAt.getDate() + WEEKLY_LOCKOUT_DAYS);

      return {
        set: {
          id: dailySet.id,
          date: dailySet.date,
          theme: dailySet.theme,
          themeEn: dailySet.themeEn,
        },
        isLocked: true,
        unlocksAt,
        lastResult: {
          score: entry.score,
          correctAnswers: entry.correctAnswers,
          totalTimeSeconds: entry.totalTimeSeconds,
        },
      };
    }

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - WEEKLY_LOCKOUT_DAYS);

    const recentEntry = await this.prisma.leaderboardEntry.findFirst({
      where: {
        userId,
        createdAt: { gte: sevenDaysAgo },
      },
      orderBy: { createdAt: 'desc' },
      select: {
        score: true,
        correctAnswers: true,
        totalTimeSeconds: true,
        createdAt: true,
      },
    });

    if (recentEntry) {
      const unlocksAt = new Date(recentEntry.createdAt);
      unlocksAt.setDate(unlocksAt.getDate() + WEEKLY_LOCKOUT_DAYS);

      if (unlocksAt > new Date()) {
        return {
          set: {
            id: dailySet.id,
            date: dailySet.date,
            theme: dailySet.theme,
            themeEn: dailySet.themeEn,
          },
          isLocked: true,
          unlocksAt,
          lastResult: {
            score: recentEntry.score,
            correctAnswers: recentEntry.correctAnswers,
            totalTimeSeconds: recentEntry.totalTimeSeconds,
          },
        };
      }
    }

    return {
      set: {
        id: dailySet.id,
        date: dailySet.date,
        theme: dailySet.theme,
        themeEn: dailySet.themeEn,
      },
      isLocked: false,
      unlocksAt: null,
      lastResult: null,
    };
  }

  private async getCategoriesWithCount(
    excludedIds: string[],
    answeredSet: Set<string>,
  ) {
    const categories = await this.prisma.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      select: {
        id: true,
        name: true,
        nameEn: true,
        slug: true,
        icon: true,
        color: true,
        description: true,
        descriptionEn: true,
        imageUrl: true,
      },
    });

    if (categories.length === 0) return [];

    const categoryIds = categories.map((c) => c.id);

    // Fetch question IDs from BOTH sources:
    // 1) Primary: Question.categoryId
    // 2) Secondary: QuestionCategory (many-to-many)
    const [primaryRows, secondaryRows] = await Promise.all([
      this.prisma.question.findMany({
        where: { status: 'approved', categoryId: { in: categoryIds } },
        select: { id: true, categoryId: true },
      }),
      this.prisma.questionCategory.findMany({
        where: { categoryId: { in: categoryIds }, question: { status: 'approved' } },
        select: { questionId: true, categoryId: true },
      }),
    ]);

    // Build unified map: categoryId → Set<questionId>
    const catQuestionMap = new Map<string, Set<string>>();
    for (const cid of categoryIds) {
      catQuestionMap.set(cid, new Set());
    }
    for (const row of primaryRows) {
      catQuestionMap.get(row.categoryId)?.add(row.id);
    }
    for (const row of secondaryRows) {
      catQuestionMap.get(row.categoryId)?.add(row.questionId);
    }

    const excludedSet = new Set(excludedIds);

    return categories.map((cat) => {
      const questionIds = catQuestionMap.get(cat.id) ?? new Set<string>();
      const totalCount = questionIds.size;
      let availableCount = 0;
      let answeredCount = 0;

      for (const qid of questionIds) {
        if (!excludedSet.has(qid)) availableCount++;
        if (answeredSet.has(qid)) answeredCount++;
      }

      return {
        ...cat,
        availableCount,
        totalCount,
        answeredCount,
        isCompleted: totalCount > 0 && answeredCount >= totalCount,
      };
    });
  }

  private async getDifficultyProgress(answeredSet: Set<string>) {
    const difficultyMap: Record<string, number[]> = {
      easy: [1, 2],
      medium: [3],
      hard: [4, 5],
    };

    // Use groupBy to count by difficulty instead of loading all questions
    const groupedCounts = await this.prisma.question.groupBy({
      by: ['difficulty'],
      where: { status: 'approved' },
      _count: { id: true },
    });

    const countByDifficulty = new Map(
      groupedCounts.map((g) => [g.difficulty, g._count.id]),
    );

    // For answered counts, we need question IDs only if user has answered any
    const needAnsweredCounts = answeredSet.size > 0;

    const result: Record<string, { totalCount: number; answeredCount: number }> = {};

    if (!needAnsweredCounts) {
      for (const [key, levels] of Object.entries(difficultyMap)) {
        let totalCount = 0;
        for (const level of levels) {
          totalCount += countByDifficulty.get(level) ?? 0;
        }
        result[key] = { totalCount, answeredCount: 0 };
      }
      return result;
    }

    // Only load IDs for answered count calculation
    const answeredQuestionIds = [...answeredSet];
    const answeredDifficulties = await this.prisma.question.findMany({
      where: {
        id: { in: answeredQuestionIds },
        status: 'approved',
      },
      select: { difficulty: true },
    });

    const answeredByDifficulty = new Map<number, number>();
    for (const q of answeredDifficulties) {
      answeredByDifficulty.set(q.difficulty, (answeredByDifficulty.get(q.difficulty) ?? 0) + 1);
    }

    for (const [key, levels] of Object.entries(difficultyMap)) {
      let totalCount = 0;
      let answeredCount = 0;
      for (const level of levels) {
        totalCount += countByDifficulty.get(level) ?? 0;
        answeredCount += answeredByDifficulty.get(level) ?? 0;
      }
      result[key] = { totalCount, answeredCount };
    }

    return result;
  }

  private async getPublishedCollections(userId: string) {
    const now = new Date();

    const collections = await this.prisma.collection.findMany({
      where: {
        status: 'published',
        OR: [
          { startDate: null },
          { startDate: { lte: now } },
        ],
        AND: [
          {
            OR: [
              { endDate: null },
              { endDate: { gte: now } },
            ],
          },
        ],
      },
      orderBy: { sortOrder: 'asc' },
      select: {
        id: true,
        title: true,
        titleEn: true,
        description: true,
        descriptionEn: true,
        icon: true,
        imageUrl: true,
        type: true,
        _count: { select: { questions: true } },
      },
    });

    const completedProgress = await this.prisma.userCollectionProgress.findMany({
      where: {
        userId,
        collectionType: 'collection',
        referenceId: { in: collections.map((c) => c.id) },
      },
      select: { referenceId: true },
    });
    const completedIds = new Set(completedProgress.map((p) => p.referenceId));

    return collections.map((c) => ({
      ...c,
      isCompleted: completedIds.has(c.id),
    }));
  }
}
