import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { QuestionFilterDto } from './dto/question-filter.dto';
import { AnswerQuestionDto } from './dto/answer-question.dto';
import { getExcludedQuestionIds } from '@/modules/shared/anti-repeat';

@Injectable()
export class QuestionsService {
  constructor(private readonly prisma: PrismaService) {}

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

    await this.prisma.$transaction(async (tx) => {
      await tx.userQuestionHistory.create({
        data: {
          userId,
          questionId,
          result,
          timeSpentSeconds: dto.timeSpentSeconds,
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

      await tx.user.update({
        where: { id: userId },
        data: {
          totalGamesPlayed: { increment: 1 },
          ...(isCorrect ? { totalCorrectAnswers: { increment: 1 } } : {}),
        },
      });
    });

    const score = this.calculateScore(
      question.difficulty,
      dto.timeSpentSeconds,
      isCorrect,
    );

    return {
      correct: isCorrect,
      score,
      isTrue: question.isTrue,
      explanation: question.explanation,
      source: question.source,
      sourceUrl: question.sourceUrl,
    };
  }

  private calculateScore(
    difficulty: number,
    timeSpentSeconds: number,
    isCorrect: boolean,
  ): number {
    if (!isCorrect) {
      return 0;
    }

    const baseScore = 100;
    const difficultyBonus = difficulty * 20;
    const timeBonus = Math.max(0, 60 - timeSpentSeconds) * 2;

    return baseScore + difficultyBonus + timeBonus;
  }
}
