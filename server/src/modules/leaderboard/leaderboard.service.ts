import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import type { LeaderboardType } from './leaderboard.controller';

interface AggRow {
  userId: string;
  correctAnswers: number;
  totalQuestions: number;
  totalTimeSeconds: number;
  score: number;
}

interface LeaderboardEntryResult {
  rank: number;
  userId: string;
  nickname: string | null;
  avatarEmoji: string | null;
  correctAnswers: number;
  totalQuestions: number;
  score: number;
  totalTimeSeconds: number;
  currentStreak?: number;
  bestStreak?: number;
}

export interface LeaderboardResponse {
  entries: LeaderboardEntryResult[];
  userPosition: number | null;
  totalPlayers: number;
  userContext?: LeaderboardEntryResult[];
  currentUserId?: string;
}

@Injectable()
export class LeaderboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getWeeklyLeaderboard(
    userId: string,
    type?: LeaderboardType,
  ): Promise<LeaderboardResponse> {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

    const monday = new Date(now);
    monday.setDate(now.getDate() - diffToMonday);
    monday.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(23, 59, 59, 999);

    return this.getAggregatedLeaderboard(userId, { gte: monday, lte: today }, type);
  }

  async getMonthlyLeaderboard(
    userId: string,
    type?: LeaderboardType,
  ): Promise<LeaderboardResponse> {
    const now = new Date();
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    firstOfMonth.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(23, 59, 59, 999);

    return this.getAggregatedLeaderboard(userId, {
      gte: firstOfMonth,
      lte: today,
    }, type);
  }

  async getYearlyLeaderboard(
    userId: string,
    type?: LeaderboardType,
  ): Promise<LeaderboardResponse> {
    const firstOfYear = new Date(new Date().getFullYear(), 0, 1);
    firstOfYear.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(23, 59, 59, 999);

    return this.getAggregatedLeaderboard(userId, {
      gte: firstOfYear,
      lte: today,
    }, type);
  }

  async getAllTimeLeaderboard(
    userId: string,
    type?: LeaderboardType,
  ): Promise<LeaderboardResponse> {
    // All-time uses User model directly (totalCorrectAnswers / totalScore)
    // because UserQuestionHistory may be incomplete for historical daily sets
    const orderBy = type === 'score'
      ? { totalScore: 'desc' as const }
      : { totalCorrectAnswers: 'desc' as const };

    const users = await this.prisma.user.findMany({
      where: type === 'score'
        ? { totalScore: { gt: 0 } }
        : { totalCorrectAnswers: { gt: 0 } },
      select: {
        id: true,
        nickname: true,
        avatarEmoji: true,
        totalCorrectAnswers: true,
        totalScore: true,
      },
      orderBy,
    });

    const totalPlayers = users.length;

    let userPosition: number | null = null;
    const userIndex = users.findIndex((u) => u.id === userId);
    if (userIndex !== -1) {
      userPosition = userIndex + 1;
    }

    const top100 = users.slice(0, 100);

    const entries: LeaderboardEntryResult[] = top100.map((u, index) => ({
      rank: index + 1,
      userId: u.id,
      nickname: u.nickname,
      avatarEmoji: u.avatarEmoji,
      correctAnswers: u.totalCorrectAnswers,
      totalQuestions: 0,
      score: u.totalScore,
      totalTimeSeconds: 0,
    }));

    // Build user context only if user is outside the visible entries list
    let userContext: LeaderboardEntryResult[] | undefined;
    if (userPosition && userPosition > top100.length) {
      const contextIndices = [userIndex - 1, userIndex, userIndex + 1].filter(
        (i) => i >= 0 && i < users.length,
      );
      userContext = contextIndices.map((i) => {
        const u = users[i];
        return {
          rank: i + 1,
          userId: u.id,
          nickname: u.nickname,
          avatarEmoji: u.avatarEmoji,
          correctAnswers: u.totalCorrectAnswers,
          totalQuestions: 0,
          score: u.totalScore,
          totalTimeSeconds: 0,
        };
      });
    } else if (!userPosition) {
      userContext = await this.buildUnrankedUserContext(userId);
    }

    return { entries, userPosition, totalPlayers, userContext, currentUserId: userId };
  }

  async getStreakLeaderboard(userId: string, period?: string): Promise<LeaderboardResponse> {
    const dateFilter = this.getDateFilter(period);

    // For time-filtered periods, calculate streaks from UserQuestionHistory
    if (dateFilter) {
      return this.getStreakLeaderboardByPeriod(userId, dateFilter);
    }

    // All-time uses User model directly
    const users = await this.prisma.user.findMany({
      where: { bestAnswerStreak: { gt: 0 } },
      select: {
        id: true,
        nickname: true,
        avatarEmoji: true,
        currentAnswerStreak: true,
        bestAnswerStreak: true,
      },
      orderBy: [
        { bestAnswerStreak: 'desc' },
        { currentAnswerStreak: 'desc' },
      ],
    });

    const totalPlayers = users.length;

    let userPosition: number | null = null;
    const userIndex = users.findIndex((u) => u.id === userId);
    if (userIndex !== -1) {
      userPosition = userIndex + 1;
    }

    const top100 = users.slice(0, 100);

    const entries: LeaderboardEntryResult[] = top100.map((u, index) => ({
      rank: index + 1,
      userId: u.id,
      nickname: u.nickname,
      avatarEmoji: u.avatarEmoji,
      correctAnswers: 0,
      totalQuestions: 0,
      score: 0,
      totalTimeSeconds: 0,
      currentStreak: u.currentAnswerStreak,
      bestStreak: u.bestAnswerStreak,
    }));

    // Build user context only if user is outside the visible entries list
    let userContext: LeaderboardEntryResult[] | undefined;
    if (userPosition && userPosition > top100.length) {
      const contextIndices = [userIndex - 1, userIndex, userIndex + 1].filter(
        (i) => i >= 0 && i < users.length,
      );
      userContext = contextIndices.map((i) => {
        const u = users[i];
        return {
          rank: i + 1,
          userId: u.id,
          nickname: u.nickname,
          avatarEmoji: u.avatarEmoji,
          correctAnswers: 0,
          totalQuestions: 0,
          score: 0,
          totalTimeSeconds: 0,
          currentStreak: u.currentAnswerStreak,
          bestStreak: u.bestAnswerStreak,
        };
      });
    } else if (!userPosition) {
      const currentUser = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, nickname: true, avatarEmoji: true, currentAnswerStreak: true, bestAnswerStreak: true },
      });
      if (currentUser) {
        const baseContext = await this.buildUnrankedUserContext(userId);
        userContext = baseContext ? baseContext.map((entry) => ({
          ...entry,
          currentStreak: currentUser.currentAnswerStreak,
          bestStreak: currentUser.bestAnswerStreak,
        })) : undefined;
      }
    }

    return { entries, userPosition, totalPlayers, userContext, currentUserId: userId };
  }

  private async getStreakLeaderboardByPeriod(
    userId: string,
    dateFilter: { gte: Date; lte: Date },
  ): Promise<LeaderboardResponse> {
    interface StreakRow { userId: string; bestStreak: number }

    const streakRows = await this.prisma.$queryRaw<StreakRow[]>`
      WITH ordered AS (
        SELECT
          "userId",
          "result",
          SUM(CASE WHEN "result" != 'correct' THEN 1 ELSE 0 END)
            OVER (PARTITION BY "userId" ORDER BY "id") AS grp
        FROM "UserQuestionHistory"
        WHERE "answeredAt" >= ${dateFilter.gte} AND "answeredAt" <= ${dateFilter.lte}
      ),
      streaks AS (
        SELECT
          "userId",
          COUNT(*)::int AS streak_len
        FROM ordered
        WHERE "result" = 'correct'
        GROUP BY "userId", grp
      )
      SELECT
        "userId",
        MAX(streak_len)::int AS "bestStreak"
      FROM streaks
      GROUP BY "userId"
      HAVING MAX(streak_len) > 0
      ORDER BY "bestStreak" DESC
    `;

    const totalPlayers = streakRows.length;

    let userPosition: number | null = null;
    const userIndex = streakRows.findIndex((r) => r.userId === userId);
    if (userIndex !== -1) {
      userPosition = userIndex + 1;
    }

    const top100 = streakRows.slice(0, 100);

    const userIds = top100.map((r) => r.userId);
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, nickname: true, avatarEmoji: true },
    });
    const userMap = new Map(
      users.map((u) => [u.id, { nickname: u.nickname, avatarEmoji: u.avatarEmoji }]),
    );

    const entries: LeaderboardEntryResult[] = top100.map((r, index) => ({
      rank: index + 1,
      userId: r.userId,
      nickname: userMap.get(r.userId)?.nickname ?? null,
      avatarEmoji: userMap.get(r.userId)?.avatarEmoji ?? null,
      correctAnswers: 0,
      totalQuestions: 0,
      score: 0,
      totalTimeSeconds: 0,
      bestStreak: r.bestStreak,
    }));

    let userContext: LeaderboardEntryResult[] | undefined;
    if (userPosition && userPosition > top100.length) {
      const contextIndices = [userIndex - 1, userIndex, userIndex + 1].filter(
        (i) => i >= 0 && i < streakRows.length,
      );
      const contextUserIds = contextIndices.map((i) => streakRows[i].userId);
      const contextUsers = await this.prisma.user.findMany({
        where: { id: { in: contextUserIds } },
        select: { id: true, nickname: true, avatarEmoji: true },
      });
      const contextUserMap = new Map(
        contextUsers.map((u) => [u.id, { nickname: u.nickname, avatarEmoji: u.avatarEmoji }]),
      );
      userContext = contextIndices.map((i) => {
        const r = streakRows[i];
        return {
          rank: i + 1,
          userId: r.userId,
          nickname: contextUserMap.get(r.userId)?.nickname ?? null,
          avatarEmoji: contextUserMap.get(r.userId)?.avatarEmoji ?? null,
          correctAnswers: 0,
          totalQuestions: 0,
          score: 0,
          totalTimeSeconds: 0,
          bestStreak: r.bestStreak,
        };
      });
    } else if (!userPosition) {
      const currentUser = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, nickname: true, avatarEmoji: true, currentAnswerStreak: true, bestAnswerStreak: true },
      });
      if (currentUser) {
        const baseContext = await this.buildUnrankedUserContext(userId);
        userContext = baseContext ? baseContext.map((entry) => ({
          ...entry,
          currentStreak: currentUser.currentAnswerStreak,
          bestStreak: currentUser.bestAnswerStreak,
        })) : undefined;
      }
    }

    return { entries, userPosition, totalPlayers, userContext, currentUserId: userId };
  }

  private getDateFilter(period?: string): { gte: Date; lte: Date } | null {
    if (!period || period === 'alltime') return null;

    const today = new Date();
    today.setHours(23, 59, 59, 999);

    if (period === 'weekly') {
      const now = new Date();
      const dayOfWeek = now.getDay();
      const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      const monday = new Date(now);
      monday.setDate(now.getDate() - diffToMonday);
      monday.setHours(0, 0, 0, 0);
      return { gte: monday, lte: today };
    }
    if (period === 'monthly') {
      const now = new Date();
      const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      firstOfMonth.setHours(0, 0, 0, 0);
      return { gte: firstOfMonth, lte: today };
    }
    if (period === 'yearly') {
      const firstOfYear = new Date(new Date().getFullYear(), 0, 1);
      firstOfYear.setHours(0, 0, 0, 0);
      return { gte: firstOfYear, lte: today };
    }
    return null;
  }

  private async buildUnrankedUserContext(userId: string): Promise<LeaderboardEntryResult[] | undefined> {
    const currentUser = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, nickname: true, avatarEmoji: true, totalCorrectAnswers: true, totalScore: true },
    });
    if (!currentUser) return undefined;

    // Count total questions answered
    const totalQuestions = await this.prisma.userQuestionHistory.count({
      where: { userId },
    });

    // Sum total time
    const timeAgg = await this.prisma.userQuestionHistory.aggregate({
      where: { userId },
      _sum: { timeSpentSeconds: true },
    });

    return [{
      rank: 0,
      userId: currentUser.id,
      nickname: currentUser.nickname,
      avatarEmoji: currentUser.avatarEmoji,
      correctAnswers: currentUser.totalCorrectAnswers,
      totalQuestions,
      score: currentUser.totalScore,
      totalTimeSeconds: timeAgg._sum.timeSpentSeconds ?? 0,
    }];
  }

  private async getAggregatedLeaderboard(
    userId: string,
    dateFilter?: { gte: Date; lte: Date },
    type: LeaderboardType = 'answers',
  ): Promise<LeaderboardResponse> {
    // Aggregate from UserQuestionHistory (covers ALL game modes)
    let aggregated: AggRow[];

    if (dateFilter) {
      aggregated = await this.prisma.$queryRaw<AggRow[]>`
        SELECT
          "userId",
          COUNT(*) FILTER (WHERE "result" = 'correct')::int AS "correctAnswers",
          COUNT(*)::int AS "totalQuestions",
          COALESCE(SUM("timeSpentSeconds"), 0)::int AS "totalTimeSeconds",
          COALESCE(SUM("score"), 0)::int AS "score"
        FROM "UserQuestionHistory"
        WHERE "answeredAt" >= ${dateFilter.gte} AND "answeredAt" <= ${dateFilter.lte}
        GROUP BY "userId"
        HAVING COUNT(*) FILTER (WHERE "result" = 'correct') > 0
      `;
    } else {
      aggregated = await this.prisma.$queryRaw<AggRow[]>`
        SELECT
          "userId",
          COUNT(*) FILTER (WHERE "result" = 'correct')::int AS "correctAnswers",
          COUNT(*)::int AS "totalQuestions",
          COALESCE(SUM("timeSpentSeconds"), 0)::int AS "totalTimeSeconds",
          COALESCE(SUM("score"), 0)::int AS "score"
        FROM "UserQuestionHistory"
        GROUP BY "userId"
        HAVING COUNT(*) FILTER (WHERE "result" = 'correct') > 0
      `;
    }

    if (type === 'score') {
      aggregated.sort((a, b) => {
        const scoreDiff = b.score - a.score;
        if (scoreDiff !== 0) return scoreDiff;
        return a.totalTimeSeconds - b.totalTimeSeconds;
      });
    } else {
      aggregated.sort((a, b) => {
        const correctDiff = b.correctAnswers - a.correctAnswers;
        if (correctDiff !== 0) return correctDiff;
        return a.totalTimeSeconds - b.totalTimeSeconds;
      });
    }

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
      correctAnswers: agg.correctAnswers,
      totalQuestions: agg.totalQuestions,
      score: agg.score,
      totalTimeSeconds: agg.totalTimeSeconds,
    }));

    // Build user context only if user is outside the visible entries list
    let userContext: LeaderboardEntryResult[] | undefined;
    if (userPosition && userPosition > top100.length) {
      const contextIndices = [userIndex - 1, userIndex, userIndex + 1].filter(
        (i) => i >= 0 && i < aggregated.length,
      );
      const contextUserIds = contextIndices.map((i) => aggregated[i].userId);
      const contextUsers = await this.prisma.user.findMany({
        where: { id: { in: contextUserIds } },
        select: { id: true, nickname: true, avatarEmoji: true },
      });
      const contextUserMap = new Map(
        contextUsers.map((u) => [u.id, { nickname: u.nickname, avatarEmoji: u.avatarEmoji }]),
      );
      userContext = contextIndices.map((i) => {
        const agg = aggregated[i];
        return {
          rank: i + 1,
          userId: agg.userId,
          nickname: contextUserMap.get(agg.userId)?.nickname ?? null,
          avatarEmoji: contextUserMap.get(agg.userId)?.avatarEmoji ?? null,
          correctAnswers: agg.correctAnswers,
          totalQuestions: agg.totalQuestions,
          score: agg.score,
          totalTimeSeconds: agg.totalTimeSeconds,
        };
      });
    } else if (!userPosition) {
      // User has no entries in this period — show their all-time stats
      userContext = await this.buildUnrankedUserContext(userId);
    }

    return {
      entries,
      userPosition,
      totalPlayers,
      userContext,
      currentUserId: userId,
    };
  }
}
