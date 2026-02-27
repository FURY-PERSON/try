import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class AdminStatsService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboard() {
    const now = new Date();
    const todayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );
    const thirtyDaysAgo = new Date(
      now.getTime() - 30 * 24 * 60 * 60 * 1000,
    );

    const [
      totalUsers,
      dauResult,
      mauResult,
      totalQuestionsModeration,
      totalQuestionsApproved,
      totalQuestionsRejected,
      totalDailySets,
      avgCorrectRateResult,
      questionsByCategoryRaw,
      questionsByDifficultyRaw,
      activeCategories,
    ] = await Promise.all([
      this.prisma.user.count(),

      this.prisma.user.count({
        where: {
          lastPlayedDate: { gte: todayStart },
        },
      }),

      this.prisma.user.count({
        where: {
          lastPlayedDate: { gte: thirtyDaysAgo },
        },
      }),

      this.prisma.question.count({
        where: { status: 'moderation' },
      }),

      this.prisma.question.count({
        where: { status: 'approved' },
      }),

      this.prisma.question.count({
        where: { status: 'rejected' },
      }),

      this.prisma.dailySet.count(),

      this.prisma.question.aggregate({
        where: {
          timesShown: { gt: 0 },
        },
        _avg: {
          timesCorrect: true,
          timesShown: true,
        },
        _sum: {
          timesCorrect: true,
          timesShown: true,
        },
      }),

      this.prisma.question.groupBy({
        by: ['categoryId'],
        where: { status: 'approved' },
        _count: { id: true },
      }),

      this.prisma.question.groupBy({
        by: ['difficulty'],
        where: { status: 'approved' },
        _count: { id: true },
      }),

      this.prisma.category.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
      }),
    ]);

    const totalShown = avgCorrectRateResult._sum.timesShown ?? 0;
    const totalCorrect = avgCorrectRateResult._sum.timesCorrect ?? 0;
    const avgCorrectRate =
      totalShown > 0 ? Math.round((totalCorrect / totalShown) * 10000) / 100 : 0;

    const questionsByCategory = activeCategories.map((cat) => {
      const found = questionsByCategoryRaw.find(
        (r) => r.categoryId === cat.id,
      );
      return {
        categoryId: cat.id,
        categoryName: cat.name,
        icon: cat.icon,
        count: found?._count.id ?? 0,
      };
    });

    const questionsByDifficulty = [1, 2, 3, 4, 5].map((level) => {
      const found = questionsByDifficultyRaw.find(
        (r) => r.difficulty === level,
      );
      return {
        difficulty: level,
        count: found?._count.id ?? 0,
      };
    });

    return {
      totalUsers,
      activeToday: dauResult,
      totalQuestions:
        totalQuestionsModeration +
        totalQuestionsApproved +
        totalQuestionsRejected,
      approvedQuestions: totalQuestionsApproved,
      pendingQuestions: totalQuestionsModeration,
      totalDailySets,
      publishedSets: totalDailySets,
      questionsByCategory,
      questionsByDifficulty,
    };
  }

  async getQuestionStats() {
    const [hardest, easiest, mostShown] = await Promise.all([
      this.prisma.question.findMany({
        where: {
          timesShown: { gte: 10 },
        },
        orderBy: {
          timesCorrect: 'asc',
        },
        take: 10,
        include: { category: true },
      }),

      this.prisma.question.findMany({
        where: {
          timesShown: { gte: 10 },
        },
        orderBy: {
          timesCorrect: 'desc',
        },
        take: 10,
        include: { category: true },
      }),

      this.prisma.question.findMany({
        orderBy: {
          timesShown: 'desc',
        },
        take: 10,
        include: { category: true },
      }),
    ]);

    const hardestWithRate = hardest.map((q) => ({
      ...q,
      correctRate:
        q.timesShown > 0
          ? Math.round((q.timesCorrect / q.timesShown) * 10000) / 100
          : 0,
    }));

    const easiestWithRate = easiest.map((q) => ({
      ...q,
      correctRate:
        q.timesShown > 0
          ? Math.round((q.timesCorrect / q.timesShown) * 10000) / 100
          : 0,
    }));

    const mostShownWithRate = mostShown.map((q) => ({
      ...q,
      correctRate:
        q.timesShown > 0
          ? Math.round((q.timesCorrect / q.timesShown) * 10000) / 100
          : 0,
    }));

    return {
      hardest: hardestWithRate,
      easiest: easiestWithRate,
      mostShown: mostShownWithRate,
    };
  }

  async getUserAnalytics() {
    const thirtyDaysAgo = new Date(
      Date.now() - 30 * 24 * 60 * 60 * 1000,
    );

    const [dauRaw, newUsersRaw, topPlayers, accuracyRaw] =
      await Promise.all([
        this.prisma.$queryRaw<{ date: string; count: bigint }[]>`
          SELECT DATE("answeredAt")::text AS date, COUNT(DISTINCT "userId") AS count
          FROM "UserQuestionHistory"
          WHERE "answeredAt" >= ${thirtyDaysAgo}
          GROUP BY DATE("answeredAt")
          ORDER BY date ASC
        `,

        this.prisma.$queryRaw<{ date: string; count: bigint }[]>`
          SELECT DATE("createdAt")::text AS date, COUNT(*) AS count
          FROM "User"
          WHERE "createdAt" >= ${thirtyDaysAgo}
          GROUP BY DATE("createdAt")
          ORDER BY date ASC
        `,

        this.prisma.user.findMany({
          orderBy: { totalScore: 'desc' },
          take: 10,
          select: {
            id: true,
            nickname: true,
            avatarEmoji: true,
            totalScore: true,
            totalCorrectAnswers: true,
            totalGamesPlayed: true,
            bestAnswerStreak: true,
          },
        }),

        this.prisma.userQuestionHistory.groupBy({
          by: ['result'],
          _count: { id: true },
        }),
      ]);

    const dau = dauRaw.map((r) => ({
      date: r.date,
      count: Number(r.count),
    }));

    const newUsers = newUsersRaw.map((r) => ({
      date: r.date,
      count: Number(r.count),
    }));

    const totalAnswers = accuracyRaw.reduce(
      (sum, r) => sum + r._count.id,
      0,
    );
    const correctAnswers =
      accuracyRaw.find((r) => r.result === 'correct')?._count.id ?? 0;
    const overallAccuracy =
      totalAnswers > 0
        ? Math.round((correctAnswers / totalAnswers) * 10000) / 100
        : 0;

    return {
      dau,
      newUsers,
      topPlayers,
      overallAccuracy,
      totalAnswers,
    };
  }
}
