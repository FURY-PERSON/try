import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { SubmitDailySetDto } from './dto/submit-daily-set.dto';
import { updateQuestionStatsBatch } from '@/modules/shared/update-question-stats';

const CARDS_PER_DAILY_SET = 15;
const WEEKLY_LOCKOUT_DAYS = 7;

@Injectable()
export class DailySetsService {
  constructor(private readonly prisma: PrismaService) {}

  async getTodaySet(userId: string) {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

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
                category: { select: { name: true, nameEn: true } },
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
          category: dsq.question.category,
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
        category: { select: { name: true, nameEn: true } },
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
        category: q.category,
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

    // Calculate basic stats
    const correctAnswers = dto.results.filter(
      (r) => r.result === 'correct',
    ).length;
    const totalTimeSeconds = dto.results.reduce(
      (sum, r) => sum + r.timeSpentSeconds,
      0,
    );

    // Get user for streak calculation
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Calculate streaks and score in a single pass
    let currentStreak = user.currentStreak;
    let bestStreak = user.bestStreak;
    let currentAnswerStreak = user.currentAnswerStreak;
    let bestAnswerStreak = user.bestAnswerStreak;
    let score = 0;

    const historyData = dto.results.map((r) => {
      let answerScore = 0;
      if (r.result === 'correct') {
        currentStreak++;
        currentAnswerStreak++;
        // Score: 1 base + streak bonus (floor(streak / 5))
        answerScore = 1 + Math.floor(currentAnswerStreak / 5);
        score += answerScore;
      } else {
        currentStreak = 0;
        currentAnswerStreak = 0;
      }
      bestStreak = Math.max(bestStreak, currentStreak);
      bestAnswerStreak = Math.max(bestAnswerStreak, currentAnswerStreak);

      return {
        userId,
        questionId: r.questionId,
        result: r.result,
        timeSpentSeconds: r.timeSpentSeconds,
        score: answerScore,
      };
    });

    try {
      await this.prisma.$transaction(async (tx) => {
        // Save question history
        await tx.userQuestionHistory.createMany({ data: historyData });

        // Update question stats atomically (no N+1: uses raw SQL increment)
        await updateQuestionStatsBatch(tx, dto.results);

        // Update user streak and stats
        await tx.user.update({
          where: { id: userId },
          data: {
            currentStreak,
            bestStreak,
            currentAnswerStreak,
            bestAnswerStreak,
            lastPlayedDate: new Date(),
            totalGamesPlayed: { increment: 1 },
            totalCorrectAnswers: { increment: correctAnswers },
            totalScore: { increment: score },
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

        // Record collection progress (same as other game modes)
        await tx.userCollectionProgress.create({
          data: {
            userId,
            collectionType: 'daily',
            referenceId: dailySetId,
            correctAnswers,
            totalQuestions: dto.results.length,
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
      streak: currentStreak,
      bestStreak,
      leaderboardPosition,
      correctPercent,
      percentile,
      totalPlayers: totalPlayersToday,
    };
  }
}
