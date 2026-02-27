import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { getExcludedQuestionIds, getAllAnsweredQuestionIds } from '@/modules/shared/anti-repeat';

const WEEKLY_LOCKOUT_DAYS = 7;

@Injectable()
export class HomeService {
  constructor(private readonly prisma: PrismaService) {}

  async getFeed(userId: string) {
    const [daily, categories, collections, difficultyProgress, user] = await Promise.all([
      this.getDailyStatus(userId),
      this.getCategoriesWithCount(userId),
      this.getPublishedCollections(userId),
      this.getDifficultyProgress(userId),
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

    // Find today's published daily set
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

    // Check if user already completed this daily set
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
      // Calculate unlock date (7 days after completion)
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

    // Check if user completed ANY daily set within the last 7 days (weekly lockout)
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

      // If still locked
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

  private async getCategoriesWithCount(userId: string) {
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

    const excludedIds = await getExcludedQuestionIds(this.prisma, userId);
    const answeredIds = await getAllAnsweredQuestionIds(this.prisma, userId);
    const answeredSet = new Set(answeredIds);

    const counts = await Promise.all(
      categories.map(async (cat) => {
        const catWhere = {
          OR: [
            { categoryId: cat.id },
            { categories: { some: { categoryId: cat.id } } },
          ],
          status: 'approved' as const,
        };

        const [availableCount, totalCount, catQuestions] = await Promise.all([
          this.prisma.question.count({
            where: {
              ...catWhere,
              ...(excludedIds.length > 0 ? { NOT: { id: { in: excludedIds } } } : {}),
            },
          }),
          this.prisma.question.count({ where: catWhere }),
          this.prisma.question.findMany({
            where: catWhere,
            select: { id: true },
          }),
        ]);

        const answeredCount = catQuestions.filter((q) => answeredSet.has(q.id)).length;

        return {
          ...cat,
          availableCount,
          totalCount,
          answeredCount,
          isCompleted: totalCount > 0 && answeredCount >= totalCount,
        };
      }),
    );

    return counts;
  }

  private async getDifficultyProgress(userId: string) {
    const answeredIds = await getAllAnsweredQuestionIds(this.prisma, userId);
    const answeredSet = new Set(answeredIds);

    const difficultyMap: Record<string, number[]> = {
      easy: [1, 2],
      medium: [3],
      hard: [4, 5],
    };

    const result: Record<string, { totalCount: number; answeredCount: number }> = {};

    for (const [key, levels] of Object.entries(difficultyMap)) {
      const questions = await this.prisma.question.findMany({
        where: { status: 'approved', difficulty: { in: levels } },
        select: { id: true },
      });
      const totalCount = questions.length;
      const answeredCount = questions.filter((q) => answeredSet.has(q.id)).length;
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

    // Use UserCollectionProgress to determine completion (not answered question count)
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
