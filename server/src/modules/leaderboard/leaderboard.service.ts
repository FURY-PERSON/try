import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';

const CARDS_PER_DAILY_SET = 15;

interface LeaderboardEntryResult {
  rank: number;
  userId: string;
  nickname: string | null;
  avatarEmoji: string | null;
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

    // Aggregate all users' scores (no limit — we need full list for correct ranking)
    const aggregated = await this.prisma.leaderboardEntry.groupBy({
      by: ['userId'],
      where: entryWhere,
      _sum: {
        correctAnswers: true,
        score: true,
        totalTimeSeconds: true,
      },
      _count: { _all: true },
    });

    // Sort in memory with tiebreaker: correctAnswers DESC, then totalTimeSeconds ASC (faster = better)
    aggregated.sort((a, b) => {
      const correctDiff =
        (b._sum.correctAnswers ?? 0) - (a._sum.correctAnswers ?? 0);
      if (correctDiff !== 0) return correctDiff;
      return (a._sum.totalTimeSeconds ?? 0) - (b._sum.totalTimeSeconds ?? 0);
    });

    const totalPlayers = aggregated.length;

    // Find user position from the full sorted list
    let userPosition: number | null = null;
    const userIndex = aggregated.findIndex((agg) => agg.userId === userId);
    if (userIndex !== -1) {
      userPosition = userIndex + 1;
    }

    // Take top 100 for display
    const top100 = aggregated.slice(0, 100);

    // Fetch nicknames for top 100
    const userIds = top100.map((a) => a.userId);
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, nickname: true, avatarEmoji: true },
    });
    const userMap = new Map(
      users.map((u) => [u.id, { nickname: u.nickname, avatarEmoji: u.avatarEmoji }]),
    );

    const entries: LeaderboardEntryResult[] = top100.map((agg, index) => ({
      rank: index + 1,
      userId: agg.userId,
      nickname: userMap.get(agg.userId)?.nickname ?? null,
      avatarEmoji: userMap.get(agg.userId)?.avatarEmoji ?? null,
      correctAnswers: agg._sum.correctAnswers ?? 0,
      totalQuestions: (agg._count._all ?? 0) * CARDS_PER_DAILY_SET,
      score: agg._sum.score ?? 0,
      totalTimeSeconds: agg._sum.totalTimeSeconds ?? 0,
    }));

    return {
      entries,
      userPosition,
      totalPlayers,
    };
  }
}
