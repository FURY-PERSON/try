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
    ]);

    const totalShown = avgCorrectRateResult._sum.timesShown ?? 0;
    const totalCorrect = avgCorrectRateResult._sum.timesCorrect ?? 0;
    const avgCorrectRate =
      totalShown > 0 ? Math.round((totalCorrect / totalShown) * 10000) / 100 : 0;

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
}
