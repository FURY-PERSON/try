import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';

const CARDS_PER_DAILY_SET = 15;

interface LeaderboardEntryResult {
  rank: number;
  userId: string;
  nickname: string | null;
  correctAnswers: number;
  totalQuestions: number;
  score: number;
  totalTimeSeconds: number;
}

export interface LeaderboardResponse {
  entries: LeaderboardEntryResult[];
  userPosition: number | null;
  totalPlayers: number;
}

@Injectable()
export class LeaderboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getWeeklyLeaderboard(userId: string): Promise<LeaderboardResponse> {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

    const monday = new Date(now);
    monday.setDate(now.getDate() - diffToMonday);
    monday.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(23, 59, 59, 999);

    return this.getAggregatedLeaderboard(userId, { gte: monday, lte: today });
  }

  async getMonthlyLeaderboard(userId: string): Promise<LeaderboardResponse> {
    const now = new Date();
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    firstOfMonth.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(23, 59, 59, 999);

    return this.getAggregatedLeaderboard(userId, {
      gte: firstOfMonth,
      lte: today,
    });
  }

  async getYearlyLeaderboard(userId: string): Promise<LeaderboardResponse> {
    const firstOfYear = new Date(new Date().getFullYear(), 0, 1);
    firstOfYear.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(23, 59, 59, 999);

    return this.getAggregatedLeaderboard(userId, {
      gte: firstOfYear,
      lte: today,
    });
  }

  async getAllTimeLeaderboard(userId: string): Promise<LeaderboardResponse> {
    return this.getAggregatedLeaderboard(userId);
  }

  private async getAggregatedLeaderboard(
    userId: string,
    dateFilter?: { gte: Date; lte: Date },
  ): Promise<LeaderboardResponse> {
    let dailySetIds: string[] | undefined;

    if (dateFilter) {
      const dailySets = await this.prisma.dailySet.findMany({
        where: {
          date: { gte: dateFilter.gte, lte: dateFilter.lte },
        },
        select: { id: true },
      });
      dailySetIds = dailySets.map((ds) => ds.id);

      if (dailySetIds.length === 0) {
        return { entries: [], userPosition: null, totalPlayers: 0 };
      }
    }

    const entryWhere = dailySetIds
      ? { dailySetId: { in: dailySetIds } }
      : {};

    // Top 100 by correctAnswers DESC
    const aggregated = await this.prisma.leaderboardEntry.groupBy({
      by: ['userId'],
      where: entryWhere,
      _sum: {
        correctAnswers: true,
        score: true,
        totalTimeSeconds: true,
      },
      _count: { _all: true },
      orderBy: {
        _sum: { correctAnswers: 'desc' },
      },
      take: 100,
    });

    // Total unique players
    const totalPlayersResult = await this.prisma.leaderboardEntry.groupBy({
      by: ['userId'],
      where: entryWhere,
    });

    // Fetch nicknames
    const userIds = aggregated.map((a) => a.userId);
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, nickname: true },
    });
    const userMap = new Map(users.map((u) => [u.id, u.nickname]));

    const entries: LeaderboardEntryResult[] = aggregated.map((agg, index) => ({
      rank: index + 1,
      userId: agg.userId,
      nickname: userMap.get(agg.userId) ?? null,
      correctAnswers: agg._sum.correctAnswers ?? 0,
      totalQuestions: agg._count._all * CARDS_PER_DAILY_SET,
      score: agg._sum.score ?? 0,
      totalTimeSeconds: agg._sum.totalTimeSeconds ?? 0,
    }));

    // User position
    let userPosition: number | null = null;
    const userAgg = await this.prisma.leaderboardEntry.groupBy({
      by: ['userId'],
      where: { userId, ...entryWhere },
      _sum: { correctAnswers: true },
    });

    if (userAgg.length > 0) {
      const userCorrect = userAgg[0]._sum.correctAnswers ?? 0;

      const higherUsers = await this.prisma.leaderboardEntry.groupBy({
        by: ['userId'],
        where: entryWhere,
        _sum: { correctAnswers: true },
        having: {
          correctAnswers: {
            _sum: { gt: userCorrect },
          },
        },
      });

      userPosition = higherUsers.length + 1;
    }

    return {
      entries,
      userPosition,
      totalPlayers: totalPlayersResult.length,
    };
  }
}
