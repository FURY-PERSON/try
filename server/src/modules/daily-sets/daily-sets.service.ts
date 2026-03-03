import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { SubmitDailySetDto } from './dto/submit-daily-set.dto';
import { updateQuestionStatsBatch } from '@/modules/shared/update-question-stats';

const CARDS_PER_DAILY_SET = 20;

@Injectable()
export class DailySetsService {
  constructor(private readonly prisma: PrismaService) {}

  async getTodaySet(userId: string) {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

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
                statementEn: true,
                isTrue: true,
                explanation: true,
                explanationEn: true,
                source: true,
                sourceEn: true,
                sourceUrl: true,
                sourceUrlEn: true,
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
      let progress = null;

      if (existingEntry) {
        completed = true;
        userEntry = {
          score: existingEntry.score,
          correctAnswers: existingEntry.correctAnswers,
          totalTimeSeconds: existingEntry.totalTimeSeconds,
        };
      } else {
        // Check for partial progress: questions answered today via submitAnswer
        const dailySetQuestionIds = dailySet.questions.map(
          (dsq) => dsq.question.id,
        );
        const tomorrow = new Date(today);
        tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

        const answeredToday =
          await this.prisma.userQuestionHistory.findMany({
            where: {
              userId,
              questionId: { in: dailySetQuestionIds },
              answeredAt: { gte: today, lt: tomorrow },
            },
            select: { questionId: true, result: true },
          });

        if (answeredToday.length > 0) {
          progress = {
            answeredQuestionIds: answeredToday.map((a) => a.questionId),
            results: answeredToday.map((a) => ({
              questionId: a.questionId,
              correct: a.result === 'correct',
            })),
            currentIndex: answeredToday.length,
          };
        }
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
          statementEn: dsq.question.statementEn,
          isTrue: dsq.question.isTrue,
          explanation: dsq.question.explanation,
          explanationEn: dsq.question.explanationEn,
          source: dsq.question.source,
          sourceEn: dsq.question.sourceEn,
          sourceUrl: dsq.question.sourceUrl,
          sourceUrlEn: dsq.question.sourceUrlEn,
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
        progress,
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
        statementEn: true,
        isTrue: true,
        explanation: true,
        explanationEn: true,
        source: true,
        sourceEn: true,
        sourceUrl: true,
        sourceUrlEn: true,
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
        statementEn: q.statementEn,
        isTrue: q.isTrue,
        explanation: q.explanation,
        explanationEn: q.explanationEn,
        source: q.source,
        sourceEn: q.sourceEn,
        sourceUrl: q.sourceUrl,
        sourceUrlEn: q.sourceUrlEn,
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
      progress: null,
    };
  }

  async submitDailySet(
    userId: string,
    dailySetId: string,
    dto: SubmitDailySetDto,
  ) {
    // Validate that the daily set exists — only fetch question IDs (not full question data)
    const dailySet = await this.prisma.dailySet.findUnique({
      where: { id: dailySetId },
      select: {
        id: true,
        questions: {
          select: { questionId: true },
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

    // Check which questions were already saved via submitAnswer to avoid duplicates
    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);
    const tomorrowStart = new Date(todayStart);
    tomorrowStart.setUTCDate(tomorrowStart.getUTCDate() + 1);

    const alreadySaved = await this.prisma.userQuestionHistory.findMany({
      where: {
        userId,
        questionId: { in: dto.results.map((r) => r.questionId) },
        answeredAt: { gte: todayStart, lt: tomorrowStart },
      },
      select: { questionId: true },
    });
    const alreadySavedIds = new Set(alreadySaved.map((a) => a.questionId));

    const newResults = dto.results.filter(
      (r) => !alreadySavedIds.has(r.questionId),
    );

    // Calculate streak and score only for NEW results (not already processed by answerQuestion)
    // Streak and totalScore for already-saved answers were updated in real-time by answerQuestion
    let currentStreak = user.currentStreak;
    let bestStreak = user.bestStreak;
    let currentAnswerStreak = user.currentAnswerStreak;
    let bestAnswerStreak = user.bestAnswerStreak;
    let newResultsScore = 0;

    const newHistoryData = newResults.map((r) => {
      let answerScore = 0;
      if (r.result === 'correct') {
        currentStreak++;
        currentAnswerStreak++;
        answerScore = 1;
        newResultsScore += answerScore;
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

    // LeaderboardEntry score = new results score + already-saved correct count
    // (already-saved scores were added to User.totalScore by answerQuestion, so don't increment again)
    const alreadySavedCorrectCount = dto.results.filter(
      (r) => alreadySavedIds.has(r.questionId) && r.result === 'correct',
    ).length;
    const leaderboardScore = newResultsScore + alreadySavedCorrectCount;

    try {
      await this.prisma.$transaction(async (tx) => {
        // Save question history only for answers not already saved via submitAnswer
        if (newHistoryData.length > 0) {
          await tx.userQuestionHistory.createMany({ data: newHistoryData });
          await updateQuestionStatsBatch(tx, newResults);
        }

        // Update user stats (streak already current from answerQuestion, update only for new results)
        await tx.user.update({
          where: { id: userId },
          data: {
            currentStreak,
            bestStreak,
            currentAnswerStreak,
            bestAnswerStreak,
            lastPlayedDate: new Date(),
            totalGamesPlayed: { increment: 1 },
            ...(newResults.length > 0
              ? { totalCorrectAnswers: { increment: newResults.filter((r) => r.result === 'correct').length } }
              : {}),
            totalScore: { increment: newResultsScore },
          },
        });

        // Create leaderboard entry
        await tx.leaderboardEntry.create({
          data: {
            userId,
            dailySetId,
            score: leaderboardScore,
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

    // Calculate leaderboard position, total players, and lower count in parallel
    const totalQuestionsInSet = dailySet.questions.length;
    const correctPercent = Math.round(
      (correctAnswers / totalQuestionsInSet) * 100,
    );

    const [higherCorrectCount, totalPlayersToday, lowerCount] = await Promise.all([
      this.prisma.leaderboardEntry.count({
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
      }),
      this.prisma.leaderboardEntry.count({
        where: { dailySetId },
      }),
      this.prisma.leaderboardEntry.count({
        where: {
          dailySetId,
          correctAnswers: { lt: correctAnswers },
        },
      }),
    ]);
    const leaderboardPosition = higherCorrectCount + 1;
    const percentile =
      totalPlayersToday > 0
        ? Math.round((lowerCount / totalPlayersToday) * 100)
        : 100;

    return {
      score: leaderboardScore,
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
