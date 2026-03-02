import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import type { LeaderboardType } from './leaderboard.controller';

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

const TOP_LIMIT = 100;

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

    return this.getAggregatedLeaderboard(userId, { gte: firstOfMonth, lte: today }, type);
  }

  async getYearlyLeaderboard(
    userId: string,
    type?: LeaderboardType,
  ): Promise<LeaderboardResponse> {
    const firstOfYear = new Date(new Date().getFullYear(), 0, 1);
    firstOfYear.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(23, 59, 59, 999);

    return this.getAggregatedLeaderboard(userId, { gte: firstOfYear, lte: today }, type);
  }

  async getAllTimeLeaderboard(
    userId: string,
    type?: LeaderboardType,
  ): Promise<LeaderboardResponse> {
    const orderField = type === 'score' ? 'totalScore' : 'totalCorrectAnswers';
    const whereField = type === 'score'
      ? { totalScore: { gt: 0 } }
      : { totalCorrectAnswers: { gt: 0 } };

    // Get top 100 only (not all users)
    const [top100, totalPlayers] = await Promise.all([
      this.prisma.user.findMany({
        where: whereField,
        select: {
          id: true,
          nickname: true,
          avatarEmoji: true,
          totalCorrectAnswers: true,
          totalScore: true,
        },
        orderBy: { [orderField]: 'desc' },
        take: TOP_LIMIT,
      }),
      this.prisma.user.count({ where: whereField }),
    ]);

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

    // Check if user is in top 100
    let userPosition: number | null = null;
    const userInTop = top100.findIndex((u) => u.id === userId);

    if (userInTop !== -1) {
      userPosition = userInTop + 1;
    } else {
      // Find user position via SQL COUNT
      const currentUser = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { totalCorrectAnswers: true, totalScore: true },
      });
      if (currentUser) {
        const userValue = type === 'score' ? currentUser.totalScore : currentUser.totalCorrectAnswers;
        if (userValue > 0) {
          const higherCount = await this.prisma.user.count({
            where: {
              [orderField]: { gt: userValue },
            },
          });
          userPosition = higherCount + 1;
        }
      }
    }

    // Build user context if outside top 5
    let userContext: LeaderboardEntryResult[] | undefined;
    if (userPosition && userPosition > 5 && userInTop === -1) {
      userContext = await this.buildAllTimeUserContext(userId, type);
    } else if (!userPosition) {
      userContext = await this.buildUnrankedUserContext(userId);
    }

    return { entries, userPosition, totalPlayers, userContext, currentUserId: userId };
  }

  async getStreakLeaderboard(userId: string, period?: string): Promise<LeaderboardResponse> {
    const dateFilter = this.getDateFilter(period);

    if (dateFilter) {
      return this.getStreakLeaderboardByPeriod(userId, dateFilter);
    }

    // Fetch current user once at the top with all needed fields
    const currentUser = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, nickname: true, avatarEmoji: true, currentAnswerStreak: true, bestAnswerStreak: true },
    });

    // All-time: get top 100 + count
    const [top100, totalPlayers] = await Promise.all([
      this.prisma.user.findMany({
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
        take: TOP_LIMIT,
      }),
      this.prisma.user.count({ where: { bestAnswerStreak: { gt: 0 } } }),
    ]);

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

    let userPosition: number | null = null;
    const userInTop = top100.findIndex((u) => u.id === userId);

    if (userInTop !== -1) {
      userPosition = userInTop + 1;
    } else if (currentUser && currentUser.bestAnswerStreak > 0) {
      const higherCount = await this.prisma.user.count({
        where: { bestAnswerStreak: { gt: currentUser.bestAnswerStreak } },
      });
      userPosition = higherCount + 1;
    }

    let userContext: LeaderboardEntryResult[] | undefined;
    if (currentUser && userPosition && userPosition > 5 && userInTop === -1) {
      userContext = [{
        rank: userPosition,
        userId: currentUser.id,
        nickname: currentUser.nickname,
        avatarEmoji: currentUser.avatarEmoji,
        correctAnswers: 0,
        totalQuestions: 0,
        score: 0,
        totalTimeSeconds: 0,
        currentStreak: currentUser.currentAnswerStreak,
        bestStreak: currentUser.bestAnswerStreak,
      }];
    } else if (!userPosition && currentUser) {
      userContext = [{
        rank: 0,
        userId: currentUser.id,
        nickname: currentUser.nickname,
        avatarEmoji: currentUser.avatarEmoji,
        correctAnswers: 0,
        totalQuestions: 0,
        score: 0,
        totalTimeSeconds: 0,
        currentStreak: currentUser.currentAnswerStreak,
        bestStreak: currentUser.bestAnswerStreak,
      }];
    }

    return { entries, userPosition, totalPlayers, userContext, currentUserId: userId };
  }

  private async getStreakLeaderboardByPeriod(
    userId: string,
    dateFilter: { gte: Date; lte: Date },
  ): Promise<LeaderboardResponse> {
    // Fetch all answer history within the period to compute streaks
    interface HistoryRow { userId: string; result: string; answeredAt: Date }
    const history = await this.prisma.$queryRaw<HistoryRow[]>`
      SELECT "userId", "result", "answeredAt"
      FROM "UserQuestionHistory"
      WHERE "answeredAt" >= ${dateFilter.gte} AND "answeredAt" <= ${dateFilter.lte}
      ORDER BY "userId", "answeredAt" ASC
    `;

    if (history.length === 0) {
      const userContext = await this.buildUnrankedStreakContext(userId);
      return { entries: [], userPosition: null, totalPlayers: 0, userContext, currentUserId: userId };
    }

    // Compute max streak per user within the period
    const streakMap = new Map<string, number>();
    let currentUserId: string | null = null;
    let currentStreak = 0;
    let maxStreak = 0;

    for (const row of history) {
      if (row.userId !== currentUserId) {
        // Save previous user's max streak
        if (currentUserId) {
          streakMap.set(currentUserId, Math.max(maxStreak, currentStreak));
        }
        currentUserId = row.userId;
        currentStreak = 0;
        maxStreak = 0;
      }

      if (row.result === 'correct') {
        currentStreak++;
        maxStreak = Math.max(maxStreak, currentStreak);
      } else {
        currentStreak = 0;
      }
    }
    // Save last user
    if (currentUserId) {
      streakMap.set(currentUserId, Math.max(maxStreak, currentStreak));
    }

    // Sort users by max streak descending, take top 100
    const sorted = [...streakMap.entries()]
      .filter(([, streak]) => streak > 0)
      .sort((a, b) => b[1] - a[1])
      .slice(0, TOP_LIMIT);

    const totalPlayers = [...streakMap.values()].filter((s) => s > 0).length;

    // Fetch user profiles for top entries
    const topUserIds = sorted.map(([id]) => id);
    const users = await this.prisma.user.findMany({
      where: { id: { in: topUserIds } },
      select: { id: true, nickname: true, avatarEmoji: true },
    });
    const userMap = new Map(users.map((u) => [u.id, u]));

    const entries: LeaderboardEntryResult[] = sorted.map(([uid, streak], index) => {
      const u = userMap.get(uid);
      return {
        rank: index + 1,
        userId: uid,
        nickname: u?.nickname ?? null,
        avatarEmoji: u?.avatarEmoji ?? null,
        correctAnswers: 0,
        totalQuestions: 0,
        score: 0,
        totalTimeSeconds: 0,
        bestStreak: streak,
      };
    });

    // Find current user position
    let userPosition: number | null = null;
    const userInTop = sorted.findIndex(([id]) => id === userId);
    if (userInTop !== -1) {
      userPosition = userInTop + 1;
    } else {
      const userStreak = streakMap.get(userId);
      if (userStreak && userStreak > 0) {
        const higherCount = [...streakMap.values()].filter((s) => s > userStreak).length;
        userPosition = higherCount + 1;
      }
    }

    // Build user context if not in top list
    let userContext: LeaderboardEntryResult[] | undefined;
    if (!userPosition || (userPosition > 5 && userInTop === -1)) {
      const currentUser = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, nickname: true, avatarEmoji: true },
      });
      if (currentUser) {
        const userStreak = streakMap.get(userId) ?? 0;
        userContext = [{
          rank: userPosition ?? 0,
          userId: currentUser.id,
          nickname: currentUser.nickname,
          avatarEmoji: currentUser.avatarEmoji,
          correctAnswers: 0,
          totalQuestions: 0,
          score: 0,
          totalTimeSeconds: 0,
          bestStreak: userStreak,
        }];
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

    return [{
      rank: 0,
      userId: currentUser.id,
      nickname: currentUser.nickname,
      avatarEmoji: currentUser.avatarEmoji,
      correctAnswers: currentUser.totalCorrectAnswers,
      totalQuestions: 0,
      score: currentUser.totalScore,
      totalTimeSeconds: 0,
    }];
  }

  private async buildAllTimeUserContext(
    userId: string,
    type?: LeaderboardType,
  ): Promise<LeaderboardEntryResult[] | undefined> {
    const currentUser = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, nickname: true, avatarEmoji: true, totalCorrectAnswers: true, totalScore: true },
    });
    if (!currentUser) return undefined;

    const orderField = type === 'score' ? 'totalScore' : 'totalCorrectAnswers';
    const userValue = type === 'score' ? currentUser.totalScore : currentUser.totalCorrectAnswers;
    const higherCount = await this.prisma.user.count({
      where: { [orderField]: { gt: userValue } },
    });

    return [{
      rank: higherCount + 1,
      userId: currentUser.id,
      nickname: currentUser.nickname,
      avatarEmoji: currentUser.avatarEmoji,
      correctAnswers: currentUser.totalCorrectAnswers,
      totalQuestions: 0,
      score: currentUser.totalScore,
      totalTimeSeconds: 0,
    }];
  }

  private async buildUnrankedStreakContext(userId: string): Promise<LeaderboardEntryResult[] | undefined> {
    const currentUser = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, nickname: true, avatarEmoji: true, currentAnswerStreak: true, bestAnswerStreak: true },
    });
    if (!currentUser) return undefined;

    return [{
      rank: 0,
      userId: currentUser.id,
      nickname: currentUser.nickname,
      avatarEmoji: currentUser.avatarEmoji,
      correctAnswers: 0,
      totalQuestions: 0,
      score: 0,
      totalTimeSeconds: 0,
      currentStreak: currentUser.currentAnswerStreak,
      bestStreak: currentUser.bestAnswerStreak,
    }];
  }

  private async getAggregatedLeaderboard(
    userId: string,
    dateFilter?: { gte: Date; lte: Date },
    type: LeaderboardType = 'answers',
  ): Promise<LeaderboardResponse> {
    interface AggRow {
      userId: string;
      correctAnswers: number;
      totalQuestions: number;
      totalTimeSeconds: number;
      score: number;
    }

    // Use separate tagged template queries for each ordering type instead of $queryRawUnsafe
    let top100: AggRow[];
    let totalPlayersResult: { count: bigint }[];

    if (dateFilter) {
      const topQuery = type === 'score'
        ? this.prisma.$queryRaw<AggRow[]>`
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
            ORDER BY "score" DESC, "totalTimeSeconds" ASC
            LIMIT ${TOP_LIMIT}
          `
        : this.prisma.$queryRaw<AggRow[]>`
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
            ORDER BY "correctAnswers" DESC, "totalTimeSeconds" ASC
            LIMIT ${TOP_LIMIT}
          `;

      [top100, totalPlayersResult] = await Promise.all([
        topQuery,
        this.prisma.$queryRaw<{ count: bigint }[]>`
          SELECT COUNT(DISTINCT "userId")::bigint AS count
          FROM "UserQuestionHistory"
          WHERE "answeredAt" >= ${dateFilter.gte} AND "answeredAt" <= ${dateFilter.lte}
            AND "result" = 'correct'
        `,
      ]);
    } else {
      const topQuery = type === 'score'
        ? this.prisma.$queryRaw<AggRow[]>`
            SELECT
              "userId",
              COUNT(*) FILTER (WHERE "result" = 'correct')::int AS "correctAnswers",
              COUNT(*)::int AS "totalQuestions",
              COALESCE(SUM("timeSpentSeconds"), 0)::int AS "totalTimeSeconds",
              COALESCE(SUM("score"), 0)::int AS "score"
            FROM "UserQuestionHistory"
            GROUP BY "userId"
            HAVING COUNT(*) FILTER (WHERE "result" = 'correct') > 0
            ORDER BY "score" DESC, "totalTimeSeconds" ASC
            LIMIT ${TOP_LIMIT}
          `
        : this.prisma.$queryRaw<AggRow[]>`
            SELECT
              "userId",
              COUNT(*) FILTER (WHERE "result" = 'correct')::int AS "correctAnswers",
              COUNT(*)::int AS "totalQuestions",
              COALESCE(SUM("timeSpentSeconds"), 0)::int AS "totalTimeSeconds",
              COALESCE(SUM("score"), 0)::int AS "score"
            FROM "UserQuestionHistory"
            GROUP BY "userId"
            HAVING COUNT(*) FILTER (WHERE "result" = 'correct') > 0
            ORDER BY "correctAnswers" DESC, "totalTimeSeconds" ASC
            LIMIT ${TOP_LIMIT}
          `;

      [top100, totalPlayersResult] = await Promise.all([
        topQuery,
        this.prisma.$queryRaw<{ count: bigint }[]>`
          SELECT COUNT(DISTINCT "userId")::bigint AS count
          FROM "UserQuestionHistory"
          WHERE "result" = 'correct'
        `,
      ]);
    }

    const totalPlayers = Number(totalPlayersResult[0]?.count ?? 0);

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

    // Find user position
    let userPosition: number | null = null;
    const userInTop = top100.findIndex((agg) => agg.userId === userId);

    if (userInTop !== -1) {
      userPosition = userInTop + 1;
    } else {
      // Find user's position via safe $queryRaw tagged templates
      interface UserPosRow { position: number }
      let posResult: UserPosRow[];

      if (dateFilter) {
        posResult = type === 'score'
          ? await this.prisma.$queryRaw<UserPosRow[]>`
              SELECT COUNT(*)::int + 1 AS position
              FROM (
                SELECT "userId", SUM("score") AS val
                FROM "UserQuestionHistory"
                WHERE "answeredAt" >= ${dateFilter.gte} AND "answeredAt" <= ${dateFilter.lte}
                GROUP BY "userId"
                HAVING COUNT(*) FILTER (WHERE "result" = 'correct') > 0
              ) sub
              WHERE sub.val > (
                SELECT COALESCE(SUM("score"), 0)
                FROM "UserQuestionHistory"
                WHERE "userId" = ${userId} AND "answeredAt" >= ${dateFilter.gte} AND "answeredAt" <= ${dateFilter.lte}
              )
            `
          : await this.prisma.$queryRaw<UserPosRow[]>`
              SELECT COUNT(*)::int + 1 AS position
              FROM (
                SELECT "userId", COUNT(*) FILTER (WHERE "result" = 'correct') AS val
                FROM "UserQuestionHistory"
                WHERE "answeredAt" >= ${dateFilter.gte} AND "answeredAt" <= ${dateFilter.lte}
                GROUP BY "userId"
                HAVING COUNT(*) FILTER (WHERE "result" = 'correct') > 0
              ) sub
              WHERE sub.val > (
                SELECT COALESCE(COUNT(*) FILTER (WHERE "result" = 'correct'), 0)
                FROM "UserQuestionHistory"
                WHERE "userId" = ${userId} AND "answeredAt" >= ${dateFilter.gte} AND "answeredAt" <= ${dateFilter.lte}
              )
            `;
      } else {
        posResult = type === 'score'
          ? await this.prisma.$queryRaw<UserPosRow[]>`
              SELECT COUNT(*)::int + 1 AS position
              FROM (
                SELECT "userId", SUM("score") AS val
                FROM "UserQuestionHistory"
                GROUP BY "userId"
                HAVING COUNT(*) FILTER (WHERE "result" = 'correct') > 0
              ) sub
              WHERE sub.val > (
                SELECT COALESCE(SUM("score"), 0)
                FROM "UserQuestionHistory"
                WHERE "userId" = ${userId}
              )
            `
          : await this.prisma.$queryRaw<UserPosRow[]>`
              SELECT COUNT(*)::int + 1 AS position
              FROM (
                SELECT "userId", COUNT(*) FILTER (WHERE "result" = 'correct') AS val
                FROM "UserQuestionHistory"
                GROUP BY "userId"
                HAVING COUNT(*) FILTER (WHERE "result" = 'correct') > 0
              ) sub
              WHERE sub.val > (
                SELECT COALESCE(COUNT(*) FILTER (WHERE "result" = 'correct'), 0)
                FROM "UserQuestionHistory"
                WHERE "userId" = ${userId}
              )
            `;
      }

      const pos = Number(posResult[0]?.position ?? 0);
      if (pos > 0) {
        userPosition = pos;
      }
    }

    // Build user context if user is outside top 5
    let userContext: LeaderboardEntryResult[] | undefined;
    if (userPosition && userPosition > 5 && userInTop === -1) {
      const currentUser = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, nickname: true, avatarEmoji: true },
      });
      if (currentUser) {
        // Get user's own aggregated data
        const userAgg = top100.find((a) => a.userId === userId);
        if (!userAgg) {
          // User is not in top 100, fetch their data
          let userAggData: AggRow[];
          if (dateFilter) {
            userAggData = await this.prisma.$queryRaw<AggRow[]>`
              SELECT
                "userId",
                COUNT(*) FILTER (WHERE "result" = 'correct')::int AS "correctAnswers",
                COUNT(*)::int AS "totalQuestions",
                COALESCE(SUM("timeSpentSeconds"), 0)::int AS "totalTimeSeconds",
                COALESCE(SUM("score"), 0)::int AS "score"
              FROM "UserQuestionHistory"
              WHERE "userId" = ${userId} AND "answeredAt" >= ${dateFilter.gte} AND "answeredAt" <= ${dateFilter.lte}
              GROUP BY "userId"
            `;
          } else {
            userAggData = await this.prisma.$queryRaw<AggRow[]>`
              SELECT
                "userId",
                COUNT(*) FILTER (WHERE "result" = 'correct')::int AS "correctAnswers",
                COUNT(*)::int AS "totalQuestions",
                COALESCE(SUM("timeSpentSeconds"), 0)::int AS "totalTimeSeconds",
                COALESCE(SUM("score"), 0)::int AS "score"
              FROM "UserQuestionHistory"
              WHERE "userId" = ${userId}
              GROUP BY "userId"
            `;
          }
          if (userAggData.length > 0) {
            userContext = [{
              rank: userPosition,
              userId: currentUser.id,
              nickname: currentUser.nickname,
              avatarEmoji: currentUser.avatarEmoji,
              correctAnswers: userAggData[0].correctAnswers,
              totalQuestions: userAggData[0].totalQuestions,
              score: userAggData[0].score,
              totalTimeSeconds: userAggData[0].totalTimeSeconds,
            }];
          }
        }
      }
    } else if (!userPosition) {
      userContext = await this.buildUnrankedUserContext(userId);
    }

    return { entries, userPosition, totalPlayers, userContext, currentUserId: userId };
  }
}
