import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';

interface LeaderboardEntryResult {
  rank: number;
  userId: string;
  nickname: string | null;
  score: number;
  correctAnswers: number;
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

  async getDailyLeaderboard(
    userId: string,
    dateStr?: string,
  ): Promise<LeaderboardResponse> {
    // Determine the target date
    const targetDate = dateStr ? new Date(dateStr) : new Date();
    targetDate.setHours(0, 0, 0, 0);

    // Find the daily set for this date
    const dailySet = await this.prisma.dailySet.findUnique({
      where: { date: targetDate },
    });

    if (!dailySet) {
      return { entries: [], userPosition: null, totalPlayers: 0 };
    }

    // Get top 100 entries ordered by score DESC, then totalTimeSeconds ASC (faster is better)
    const top100 = await this.prisma.leaderboardEntry.findMany({
      where: { dailySetId: dailySet.id },
      orderBy: [{ score: 'desc' }, { totalTimeSeconds: 'asc' }],
      take: 100,
      include: {
        user: {
          select: { id: true, nickname: true },
        },
      },
    });

    const entries: LeaderboardEntryResult[] = top100.map((entry, index) => ({
      rank: index + 1,
      userId: entry.userId,
      nickname: entry.user.nickname,
      score: entry.score,
      correctAnswers: entry.correctAnswers,
      totalTimeSeconds: entry.totalTimeSeconds,
    }));

    // Total players
    const totalPlayers = await this.prisma.leaderboardEntry.count({
      where: { dailySetId: dailySet.id },
    });

    // Find user's position
    const userEntry = await this.prisma.leaderboardEntry.findUnique({
      where: {
        userId_dailySetId: {
          userId,
          dailySetId: dailySet.id,
        },
      },
    });

    let userPosition: number | null = null;
    if (userEntry) {
      const higherCount = await this.prisma.leaderboardEntry.count({
        where: {
          dailySetId: dailySet.id,
          OR: [
            { score: { gt: userEntry.score } },
            {
              score: userEntry.score,
              totalTimeSeconds: { lt: userEntry.totalTimeSeconds },
            },
          ],
        },
      });
      userPosition = higherCount + 1;
    }

    return { entries, userPosition, totalPlayers };
  }

  async getWeeklyLeaderboard(userId: string): Promise<LeaderboardResponse> {
    // Calculate Monday of the current week
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, ...
    const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

    const monday = new Date(now);
    monday.setDate(now.getDate() - diffToMonday);
    monday.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(23, 59, 59, 999);

    // Find all daily sets for this week
    const dailySets = await this.prisma.dailySet.findMany({
      where: {
        date: {
          gte: monday,
          lte: today,
        },
      },
      select: { id: true },
    });

    const dailySetIds = dailySets.map((ds) => ds.id);

    if (dailySetIds.length === 0) {
      return { entries: [], userPosition: null, totalPlayers: 0 };
    }

    // Aggregate scores per user for this week's daily sets
    const aggregated = await this.prisma.leaderboardEntry.groupBy({
      by: ['userId'],
      where: {
        dailySetId: { in: dailySetIds },
      },
      _sum: {
        score: true,
        correctAnswers: true,
        totalTimeSeconds: true,
      },
      orderBy: {
        _sum: {
          score: 'desc',
        },
      },
      take: 100,
    });

    const totalPlayers = await this.prisma.leaderboardEntry.groupBy({
      by: ['userId'],
      where: {
        dailySetId: { in: dailySetIds },
      },
    });

    // Fetch nicknames for top 100 users
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
      score: agg._sum.score ?? 0,
      correctAnswers: agg._sum.correctAnswers ?? 0,
      totalTimeSeconds: agg._sum.totalTimeSeconds ?? 0,
    }));

    // Find user's position
    let userPosition: number | null = null;
    const userAgg = await this.prisma.leaderboardEntry.groupBy({
      by: ['userId'],
      where: {
        userId,
        dailySetId: { in: dailySetIds },
      },
      _sum: {
        score: true,
      },
    });

    if (userAgg.length > 0) {
      const userScore = userAgg[0]._sum.score ?? 0;

      // Count users with higher aggregated score
      const allAggregated = await this.prisma.leaderboardEntry.groupBy({
        by: ['userId'],
        where: {
          dailySetId: { in: dailySetIds },
        },
        _sum: {
          score: true,
        },
        having: {
          score: {
            _sum: {
              gt: userScore,
            },
          },
        },
      });

      userPosition = allAggregated.length + 1;
    }

    return {
      entries,
      userPosition,
      totalPlayers: totalPlayers.length,
    };
  }

  async getAllTimeLeaderboard(userId: string): Promise<LeaderboardResponse> {
    // Aggregate all scores per user
    const aggregated = await this.prisma.leaderboardEntry.groupBy({
      by: ['userId'],
      _sum: {
        score: true,
        correctAnswers: true,
        totalTimeSeconds: true,
      },
      orderBy: {
        _sum: {
          score: 'desc',
        },
      },
      take: 100,
    });

    const totalPlayersResult = await this.prisma.leaderboardEntry.groupBy({
      by: ['userId'],
    });

    // Fetch nicknames for top 100 users
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
      score: agg._sum.score ?? 0,
      correctAnswers: agg._sum.correctAnswers ?? 0,
      totalTimeSeconds: agg._sum.totalTimeSeconds ?? 0,
    }));

    // Find user's position
    let userPosition: number | null = null;
    const userAgg = await this.prisma.leaderboardEntry.groupBy({
      by: ['userId'],
      where: { userId },
      _sum: {
        score: true,
      },
    });

    if (userAgg.length > 0) {
      const userScore = userAgg[0]._sum.score ?? 0;

      const higherScoreUsers = await this.prisma.leaderboardEntry.groupBy({
        by: ['userId'],
        _sum: {
          score: true,
        },
        having: {
          score: {
            _sum: {
              gt: userScore,
            },
          },
        },
      });

      userPosition = higherScoreUsers.length + 1;
    }

    return {
      entries,
      userPosition,
      totalPlayers: totalPlayersResult.length,
    };
  }
}
