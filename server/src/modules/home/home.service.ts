import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { getExcludedQuestionIds } from '@/modules/shared/anti-repeat';

const WEEKLY_LOCKOUT_DAYS = 7;

@Injectable()
export class HomeService {
  constructor(private readonly prisma: PrismaService) {}

  async getFeed(userId: string) {
    const [daily, categories, collections, user] = await Promise.all([
      this.getDailyStatus(userId),
      this.getCategoriesWithCount(userId),
      this.getPublishedCollections(),
      this.prisma.user.findUnique({
        where: { id: userId },
        select: { currentStreak: true, nickname: true, avatarEmoji: true },
      }),
    ]);

    return {
      daily,
      categories,
      collections,
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

    // Anti-repeat: correct=14 days, incorrect=7 days cooldown (based on last answer)
    const excludedIds = await getExcludedQuestionIds(this.prisma, userId);

    const counts = await Promise.all(
      categories.map(async (cat) => {
        const availableCount = await this.prisma.question.count({
          where: {
            OR: [
              { categoryId: cat.id },
              { categories: { some: { categoryId: cat.id } } },
            ],
            status: 'approved',
            ...(excludedIds.length > 0
              ? { NOT: { id: { in: excludedIds } } }
              : {}),
          },
        });
        return { ...cat, availableCount };
      }),
    );

    return counts;
  }

  private async getPublishedCollections() {
    const now = new Date();

    return this.prisma.collection.findMany({
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
  }
}
