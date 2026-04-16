import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { GameConfigService } from '@/modules/game-config/game-config.service';
import { ShieldsService } from '@/modules/shields/shields.service';
import { QuestionFilterDto } from './dto/question-filter.dto';
import { AnswerQuestionDto } from './dto/answer-question.dto';
import { getExcludedQuestionIds } from '@/modules/shared/anti-repeat';

@Injectable()
export class QuestionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gameConfigService: GameConfigService,
    private readonly shieldsService: ShieldsService,
  ) {}

  async getRandomQuestion(userId: string, filters: QuestionFilterDto) {
    // Use anti-repeat module to get excluded IDs instead of expensive correlated subqueries
    const excludedIds = await getExcludedQuestionIds(this.prisma, userId);

    const where: Record<string, unknown> = {
      status: 'approved',
      ...(excludedIds.length > 0 ? { NOT: { id: { in: excludedIds } } } : {}),
    };

    if (filters.language) {
      where.language = filters.language;
    }

    if (filters.categoryId) {
      where.categoryId = filters.categoryId;
    }

    const count = await this.prisma.question.count({ where });

    if (count === 0) {
      throw new NotFoundException('No available questions found');
    }

    const skip = Math.floor(Math.random() * count);

    const question = await this.prisma.question.findFirst({
      where,
      skip,
      include: {
        category: true,
      },
    });

    if (!question) {
      throw new NotFoundException('No available questions found');
    }

    // Return statement without revealing the answer
    return {
      id: question.id,
      statement: question.statement,
      statementEn: question.statementEn,
      language: question.language,
      categoryId: question.categoryId,
      difficulty: question.difficulty,
      illustrationUrl: question.illustrationUrl,
      category: question.category,
    };
  }

  async answerQuestion(
    userId: string,
    questionId: string,
    dto: AnswerQuestionDto,
  ) {
    const question = await this.prisma.question.findUnique({
      where: { id: questionId },
    });

    if (!question) {
      throw new NotFoundException(
        `Question with id "${questionId}" not found`,
      );
    }

    const isCorrect = dto.userAnswer === question.isTrue;
    const result = isCorrect ? 'correct' : 'incorrect';

    // Get user for shield check and streak bonus calculation
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    // Shield applies to exactly one fact — consumed on any answer
    let shieldUsed = dto.useShield && (user?.shields ?? 0) > 0;

    const currentAnswerStreak = user?.currentAnswerStreak ?? 0;
    const streakBonusPercent = isCorrect
      ? await this.gameConfigService.getStreakBonusPercent(currentAnswerStreak + 1)
      : 0;

    const score = QuestionsService.calculateScore(
      question.difficulty,
      dto.timeSpentSeconds,
      isCorrect,
      streakBonusPercent,
    );

    let remainingShields = user?.shields ?? 0;

    await this.prisma.$transaction(async (tx) => {
      await tx.userQuestionHistory.create({
        data: {
          userId,
          questionId,
          result,
          timeSpentSeconds: dto.timeSpentSeconds,
          score,
        },
      });

      // Atomic update to avoid race conditions
      const correctIncrement = isCorrect ? 1 : 0;
      await tx.$executeRaw`
        UPDATE "Question"
        SET
          "avgTimeSeconds" = ("avgTimeSeconds" * "timesShown" + ${dto.timeSpentSeconds}::float) / ("timesShown" + 1),
          "timesShown" = "timesShown" + 1,
          "timesCorrect" = "timesCorrect" + ${correctIncrement}
        WHERE "id" = ${questionId}
      `;

      // Atomically deduct shield if used
      if (shieldUsed) {
        const deducted = await this.shieldsService.useShieldInTransaction(tx, userId);
        if (!deducted) {
          // Shield was not available (race condition)
          shieldUsed = false;
        }
      }

      // Atomic streak update using raw SQL — reads current DB values at UPDATE time,
      // preventing lost-update race condition with concurrent submitDailySet.
      const shieldProtected = !isCorrect && shieldUsed;
      await tx.$executeRaw`
        UPDATE "User"
        SET
          "currentStreak" = CASE
            WHEN ${isCorrect} THEN "currentStreak" + 1
            WHEN ${shieldProtected} THEN "currentStreak"
            ELSE 0 END,
          "currentAnswerStreak" = CASE
            WHEN ${isCorrect} THEN "currentAnswerStreak" + 1
            WHEN ${shieldProtected} THEN "currentAnswerStreak"
            ELSE 0 END,
          "bestStreak" = GREATEST("bestStreak", CASE
            WHEN ${isCorrect} THEN "currentStreak" + 1
            ELSE "currentStreak" END),
          "bestAnswerStreak" = GREATEST("bestAnswerStreak", CASE
            WHEN ${isCorrect} THEN "currentAnswerStreak" + 1
            ELSE "currentAnswerStreak" END),
          "totalCorrectAnswers" = "totalCorrectAnswers" + ${correctIncrement},
          "totalScore" = "totalScore" + ${score}
        WHERE "id" = ${userId}
      `;

      // Read updated shields balance
      const updatedUser = await tx.user.findUnique({
        where: { id: userId },
        select: { shields: true },
      });
      remainingShields = updatedUser?.shields ?? 0;
    });

    return {
      correct: isCorrect,
      score,
      isTrue: question.isTrue,
      explanation: question.explanation,
      explanationEn: question.explanationEn,
      source: question.source,
      sourceEn: question.sourceEn,
      sourceUrl: question.sourceUrl,
      sourceUrlEn: question.sourceUrlEn,
      shieldUsed,
      remainingShields,
      streakPreserved: shieldUsed,
    };
  }

  static calculateScore(
    difficulty: number,
    timeSpentSeconds: number,
    isCorrect: boolean,
    streakBonusPercent = 0,
  ): number {
    if (!isCorrect) {
      return 0;
    }

    const baseScore = 1;
    const difficultyBonus = Math.floor(difficulty / 2);
    const timeBonus = Math.floor(Math.max(0, 60 - timeSpentSeconds) / 20);
    const rawScore = baseScore + difficultyBonus + timeBonus;

    if (streakBonusPercent > 0) {
      return rawScore + Math.floor((rawScore * streakBonusPercent) / 100);
    }

    return rawScore;
  }
}
