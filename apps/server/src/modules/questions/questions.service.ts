import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { QuestionFilterDto } from './dto/question-filter.dto';
import { AnswerQuestionDto } from './dto/answer-question.dto';

@Injectable()
export class QuestionsService {
  constructor(private readonly prisma: PrismaService) {}

  async getRandomQuestion(userId: string, filters: QuestionFilterDto) {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const where: any = {
      status: 'approved',
      AND: [
        {
          NOT: {
            history: {
              some: {
                userId,
                result: 'correct',
              },
            },
          },
        },
        {
          NOT: {
            history: {
              some: {
                userId,
                result: 'incorrect',
                answeredAt: {
                  gt: sevenDaysAgo,
                },
              },
            },
          },
        },
      ],
    };

    if (filters.language) {
      where.language = filters.language;
    }

    if (filters.type) {
      where.type = filters.type;
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

    return question;
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

    const isCorrect = dto.result === 'correct';

    await this.prisma.userQuestionHistory.create({
      data: {
        userId,
        questionId,
        result: dto.result,
        timeSpentSeconds: dto.timeSpentSeconds,
      },
    });

    const newTimesShown = question.timesShown + 1;
    const newTimesCorrect = question.timesCorrect + (isCorrect ? 1 : 0);
    const newAvgTimeSeconds =
      (question.avgTimeSeconds * question.timesShown + dto.timeSpentSeconds) /
      newTimesShown;

    await this.prisma.question.update({
      where: { id: questionId },
      data: {
        timesShown: newTimesShown,
        timesCorrect: newTimesCorrect,
        avgTimeSeconds: newAvgTimeSeconds,
      },
    });

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        totalGamesPlayed: { increment: 1 },
        ...(isCorrect ? { totalCorrectAnswers: { increment: 1 } } : {}),
      },
    });

    const score = this.calculateScore(
      question.difficulty,
      dto.timeSpentSeconds,
      isCorrect,
    );

    return {
      correct: isCorrect,
      score,
      fact: question.fact,
      factSource: question.factSource,
      factSourceUrl: question.factSourceUrl,
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
