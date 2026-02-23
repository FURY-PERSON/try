import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { SubmitDailySetDto } from './dto/submit-daily-set.dto';

const CARDS_PER_DAILY_SET = 15;
const WEEKLY_LOCKOUT_DAYS = 7;

@Injectable()
export class DailySetsService {
  constructor(private readonly prisma: PrismaService) {}

  async getTodaySet(userId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check weekly lockout: did user complete any daily set in the last 7 days?
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
        dailySet: {
          select: { id: true, date: true, theme: true, themeEn: true },
        },
      },
    });

    // Find published daily set for today
    let dailySet = await this.prisma.dailySet.findUnique({
      where: { date: today },
      include: {
        questions: {
          orderBy: { sortOrder: 'asc' },
          include: {
            question: {
              select: {
                id: true,
                statement: true,
                isTrue: true,
                explanation: true,
                source: true,
                sourceUrl: true,
                language: true,
                categoryId: true,
                difficulty: true,
                illustrationUrl: true,
              },
            },
          },
        },
      },
    });

    // Only return if status is published
    if (dailySet && dailySet.status !== 'published') {
      dailySet = null;
    }

    // If user played recently, check lockout
    if (recentEntry) {
      const unlocksAt = new Date(recentEntry.createdAt);
      unlocksAt.setDate(unlocksAt.getDate() + WEEKLY_LOCKOUT_DAYS);

      if (unlocksAt > new Date()) {
        // User is locked out
        return {
          id: dailySet?.id ?? null,
          date: dailySet?.date ?? today,
          theme: dailySet?.theme ?? null,
          themeEn: dailySet?.themeEn ?? null,
          status: dailySet?.status ?? 'locked',
          questions: [],
          completed: true,
          isLocked: true,
          unlocksAt,
          userEntry: {
            score: recentEntry.score,
            correctAnswers: recentEntry.correctAnswers,
            totalTimeSeconds: recentEntry.totalTimeSeconds,
          },
        };
      }
    }

    if (dailySet) {
      // Check user's completion of today's specific set
      const existingEntry = await this.prisma.leaderboardEntry.findUnique({
        where: {
          userId_dailySetId: {
            userId,
            dailySetId: dailySet.id,
          },
        },
      });

      let completed = false;
      let userEntry = null;

      if (existingEntry) {
        completed = true;
        userEntry = {
          score: existingEntry.score,
          correctAnswers: existingEntry.correctAnswers,
          totalTimeSeconds: existingEntry.totalTimeSeconds,
        };
      }

      return {
        id: dailySet.id,
        date: dailySet.date,
        theme: dailySet.theme,
        themeEn: dailySet.themeEn,
        status: dailySet.status,
        questions: dailySet.questions.map((dsq) => ({
          id: dsq.question.id,
          statement: dsq.question.statement,
          isTrue: dsq.question.isTrue,
          explanation: dsq.question.explanation,
          source: dsq.question.source,
          sourceUrl: dsq.question.sourceUrl,
          language: dsq.question.language,
          categoryId: dsq.question.categoryId,
          difficulty: dsq.question.difficulty,
          illustrationUrl: dsq.question.illustrationUrl,
          sortOrder: dsq.sortOrder,
        })),
        completed,
        isLocked: false,
        unlocksAt: null,
        userEntry,
      };
    }

    // Fallback: generate from random approved questions using random offset
    const totalApproved = await this.prisma.question.count({
      where: { status: 'approved' },
    });
    const maxSkip = Math.max(0, totalApproved - CARDS_PER_DAILY_SET);
    const randomSkip = Math.floor(Math.random() * (maxSkip + 1));

    const fallbackQuestions = await this.prisma.question.findMany({
      where: { status: 'approved' },
      skip: randomSkip,
      take: CARDS_PER_DAILY_SET,
      orderBy: { id: 'asc' },
      select: {
        id: true,
        statement: true,
        isTrue: true,
        explanation: true,
        source: true,
        sourceUrl: true,
        language: true,
        categoryId: true,
        difficulty: true,
        illustrationUrl: true,
      },
    });

    // Shuffle for additional randomness
    for (let i = fallbackQuestions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [fallbackQuestions[i], fallbackQuestions[j]] = [
        fallbackQuestions[j],
        fallbackQuestions[i],
      ];
    }

    return {
      id: null,
      date: today,
      theme: null,
      themeEn: null,
      status: 'fallback',
      questions: fallbackQuestions.map((q, index) => ({
        id: q.id,
        statement: q.statement,
        isTrue: q.isTrue,
        explanation: q.explanation,
        source: q.source,
        sourceUrl: q.sourceUrl,
        language: q.language,
        categoryId: q.categoryId,
        difficulty: q.difficulty,
        illustrationUrl: q.illustrationUrl,
        sortOrder: index + 1,
      })),
      completed: false,
      isLocked: false,
      unlocksAt: null,
      userEntry: null,
    };
  }

  async submitDailySet(
    userId: string,
    dailySetId: string,
    dto: SubmitDailySetDto,
  ) {
    // Validate that the daily set exists
    const dailySet = await this.prisma.dailySet.findUnique({
      where: { id: dailySetId },
      include: {
        questions: {
          include: { question: true },
        },
      },
    });

    if (!dailySet) {
      throw new NotFoundException(
        `Daily set with id "${dailySetId}" not found`,
      );
    }

    // Check if user already submitted for this daily set
    const existingEntry = await this.prisma.leaderboardEntry.findUnique({
      where: {
        userId_dailySetId: {
          userId,
          dailySetId,
        },
      },
    });

    if (existingEntry) {
      throw new BadRequestException(
        'You have already submitted results for this daily set',
      );
    }

    // Validate all submitted question IDs belong to this daily set
    const dailySetQuestionIds = new Set(
      dailySet.questions.map((dsq) => dsq.questionId),
    );
    for (const result of dto.results) {
      if (!dailySetQuestionIds.has(result.questionId)) {
        throw new BadRequestException(
          `Question "${result.questionId}" does not belong to this daily set`,
        );
      }
    }

    // Calculate score and stats
    const correctAnswers = dto.results.filter(
      (r) => r.result === 'correct',
    ).length;
    const totalTimeSeconds = dto.results.reduce(
      (sum, r) => sum + r.timeSpentSeconds,
      0,
    );
    // Score: 100 points per correct answer, bonus for speed (max 50 per question)
    const score = dto.results.reduce((total, r) => {
      if (r.result === 'correct') {
        const speedBonus = Math.max(0, 50 - r.timeSpentSeconds);
        return total + 100 + speedBonus;
      }
      return total;
    }, 0);

    // Get user for streak calculation
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check weekly lockout: user can only play once per 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - WEEKLY_LOCKOUT_DAYS);

    const recentCompletion = await this.prisma.leaderboardEntry.findFirst({
      where: {
        userId,
        createdAt: { gte: sevenDaysAgo },
      },
    });

    if (recentCompletion) {
      throw new BadRequestException(
        'You have already completed a daily set this week. Try again later.',
      );
    }

    // Calculate streak (weekly cadence: playing within 14 days maintains streak)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let newCurrentStreak: number;

    if (user.lastPlayedDate) {
      const lastPlayed = new Date(user.lastPlayedDate);
      lastPlayed.setHours(0, 0, 0, 0);

      const diffTime = today.getTime() - lastPlayed.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 0) {
        throw new BadRequestException('You have already played today');
      } else if (diffDays <= 14) {
        // Within 2 weeks — streak continues (weekly cadence)
        newCurrentStreak = user.currentStreak + 1;
      } else {
        // Missed more than 2 weeks — streak resets
        newCurrentStreak = 1;
      }
    } else {
      newCurrentStreak = 1;
    }

    const newBestStreak = Math.max(user.bestStreak, newCurrentStreak);

    try {
      await this.prisma.$transaction(async (tx) => {
        // Update user streak and stats
        await tx.user.update({
          where: { id: userId },
          data: {
            currentStreak: newCurrentStreak,
            bestStreak: newBestStreak,
            lastPlayedDate: today,
            totalGamesPlayed: { increment: 1 },
            totalCorrectAnswers: { increment: correctAnswers },
          },
        });

        // Create leaderboard entry
        await tx.leaderboardEntry.create({
          data: {
            userId,
            dailySetId,
            score,
            correctAnswers,
            totalTimeSeconds,
          },
        });
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new BadRequestException(
          'You have already submitted results for this daily set',
        );
      }
      throw error;
    }

    // Calculate leaderboard position by correctAnswers
    const higherCorrectCount = await this.prisma.leaderboardEntry.count({
      where: {
        dailySetId,
        OR: [
          { correctAnswers: { gt: correctAnswers } },
          {
            correctAnswers,
            totalTimeSeconds: { lt: totalTimeSeconds },
          },
        ],
      },
    });
    const leaderboardPosition = higherCorrectCount + 1;

    // Calculate percentage and percentile
    const totalQuestionsInSet = dailySet.questions.length;
    const correctPercent = Math.round(
      (correctAnswers / totalQuestionsInSet) * 100,
    );

    const totalPlayersToday = await this.prisma.leaderboardEntry.count({
      where: { dailySetId },
    });
    const lowerCount = await this.prisma.leaderboardEntry.count({
      where: {
        dailySetId,
        correctAnswers: { lt: correctAnswers },
      },
    });
    const percentile =
      totalPlayersToday > 0
        ? Math.round((lowerCount / totalPlayersToday) * 100)
        : 100;

    return {
      score,
      correctAnswers,
      totalQuestions: totalQuestionsInSet,
      totalTimeSeconds,
      streak: newCurrentStreak,
      bestStreak: newBestStreak,
      leaderboardPosition,
      correctPercent,
      percentile,
      totalPlayers: totalPlayersToday,
    };
  }
}
