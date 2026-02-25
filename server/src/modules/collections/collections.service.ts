import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { StartCollectionDto } from './dto/start-collection.dto';
import { SubmitCollectionDto } from './dto/submit-collection.dto';
import { getExcludedQuestionIds } from '@/modules/shared/anti-repeat';

interface SessionData {
  userId: string;
  type: string;
  referenceId: string | null;
  difficulty: string | null;
  questionIds: string[];
  createdAt: number;
}

const DIFFICULTY_MAP: Record<string, number[]> = {
  easy: [1, 2],
  medium: [3],
  hard: [4, 5],
};

const SESSION_TTL_MS = 30 * 60 * 1000; // 30 minutes

@Injectable()
export class CollectionsService {
  private sessions = new Map<string, SessionData>();

  constructor(private readonly prisma: PrismaService) {}

  async getPublishedList(userId: string) {
    const now = new Date();

    const collections = await this.prisma.collection.findMany({
      where: {
        status: 'published',
        OR: [{ startDate: null }, { startDate: { lte: now } }],
        AND: [{ OR: [{ endDate: null }, { endDate: { gte: now } }] }],
      },
      orderBy: { sortOrder: 'asc' },
      select: {
        id: true,
        title: true,
        titleEn: true,
        description: true,
        descriptionEn: true,
        icon: true,
        imageUrl: true,
        type: true,
        _count: { select: { questions: true } },
      },
    });

    // Check which collections this user has completed
    const completedProgress = await this.prisma.userCollectionProgress.findMany({
      where: {
        userId,
        collectionType: 'collection',
        referenceId: { in: collections.map((c) => c.id) },
      },
      select: { referenceId: true },
    });
    const completedIds = new Set(completedProgress.map((p) => p.referenceId));

    return collections.map((c) => ({
      ...c,
      completed: completedIds.has(c.id),
    }));
  }

  async getById(userId: string, id: string) {
    const now = new Date();

    const collection = await this.prisma.collection.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        titleEn: true,
        description: true,
        descriptionEn: true,
        icon: true,
        imageUrl: true,
        type: true,
        startDate: true,
        endDate: true,
        _count: { select: { questions: true } },
      },
    });

    if (!collection || collection.startDate && now < collection.startDate) {
      throw new NotFoundException('Collection not found');
    }
    if (collection.endDate && now > collection.endDate) {
      throw new NotFoundException('Collection has expired');
    }

    // Check completion status
    const progress = await this.prisma.userCollectionProgress.findFirst({
      where: {
        userId,
        collectionType: 'collection',
        referenceId: id,
      },
      orderBy: { completedAt: 'desc' },
      select: { correctAnswers: true, totalQuestions: true, completedAt: true },
    });

    return {
      ...collection,
      completed: !!progress,
      lastResult: progress
        ? {
            correctAnswers: progress.correctAnswers,
            totalQuestions: progress.totalQuestions,
            completedAt: progress.completedAt,
          }
        : null,
    };
  }

  async start(userId: string, dto: StartCollectionDto) {
    const count = dto.count ?? 10;

    if (dto.type === 'category') {
      return this.startByCategory(userId, dto.categoryId!, count);
    }
    if (dto.type === 'difficulty') {
      return this.startByDifficulty(userId, dto.difficulty!, count);
    }
    if (dto.type === 'collection') {
      return this.startByCollection(userId, dto.collectionId!, count);
    }

    throw new BadRequestException('Invalid collection type');
  }

  async submit(userId: string, sessionId: string, dto: SubmitCollectionDto) {
    const session = this.sessions.get(sessionId);

    if (!session) {
      throw new NotFoundException('Session not found or expired');
    }

    if (session.userId !== userId) {
      throw new BadRequestException('Session does not belong to this user');
    }

    // Validate submitted questions belong to the session
    const sessionQuestionIds = new Set(session.questionIds);
    for (const result of dto.results) {
      if (!sessionQuestionIds.has(result.questionId)) {
        throw new BadRequestException(
          `Question "${result.questionId}" does not belong to this session`,
        );
      }
    }

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

    // Calculate streak based on consecutive correct answers
    let currentStreak = user.currentStreak;
    let bestStreak = user.bestStreak;

    for (const result of dto.results) {
      if (result.result === 'correct') {
        currentStreak++;
      } else {
        currentStreak = 0;
      }
      bestStreak = Math.max(bestStreak, currentStreak);
    }

    // Record question history
    const historyData = dto.results.map((r) => ({
      userId,
      questionId: r.questionId,
      result: r.result,
      timeSpentSeconds: r.timeSpentSeconds,
    }));

    await this.prisma.$transaction(async (tx) => {
      // Save question history
      await tx.userQuestionHistory.createMany({ data: historyData });

      // Update question stats
      for (const result of dto.results) {
        const isCorrect = result.result === 'correct';
        const question = await tx.question.findUnique({
          where: { id: result.questionId },
        });
        if (question) {
          const newTimesShown = question.timesShown + 1;
          const newTimesCorrect = question.timesCorrect + (isCorrect ? 1 : 0);
          const newAvgTime =
            (question.avgTimeSeconds * question.timesShown +
              result.timeSpentSeconds) /
            newTimesShown;

          await tx.question.update({
            where: { id: result.questionId },
            data: {
              timesShown: newTimesShown,
              timesCorrect: newTimesCorrect,
              avgTimeSeconds: newAvgTime,
            },
          });
        }
      }

      // Update user stats and streak
      await tx.user.update({
        where: { id: userId },
        data: {
          totalCorrectAnswers: { increment: correctAnswers },
          currentStreak,
          bestStreak,
        },
      });

      // Record collection progress
      await tx.userCollectionProgress.create({
        data: {
          userId,
          collectionType: session.type,
          referenceId: session.referenceId,
          difficulty: session.difficulty,
          correctAnswers,
          totalQuestions: session.questionIds.length,
        },
      });
    });

    // Clean up session
    this.sessions.delete(sessionId);

    // Calculate score
    const score = dto.results.reduce((total, r) => {
      if (r.result === 'correct') {
        const speedBonus = Math.max(0, 50 - r.timeSpentSeconds);
        return total + 100 + speedBonus;
      }
      return total;
    }, 0);

    return {
      correctAnswers,
      totalQuestions: session.questionIds.length,
      totalTimeSeconds,
      score,
      streak: currentStreak,
      bestStreak,
    };
  }

  private async startByCategory(
    userId: string,
    categoryId: string,
    count: number,
  ) {
    if (!categoryId) {
      throw new BadRequestException('categoryId is required for category type');
    }

    const category = await this.prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!category || !category.isActive) {
      throw new NotFoundException('Category not found or inactive');
    }

    const questions = await this.getQuestionsWithAntiRepeat(userId, count, {
      OR: [{ categoryId }, { categories: { some: { categoryId } } }],
    });

    const sessionId = this.createSession(userId, 'category', categoryId, null, questions);

    return {
      sessionId,
      questions: questions.map((q) => ({
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
      })),
    };
  }

  private async startByDifficulty(
    userId: string,
    difficulty: string,
    count: number,
  ) {
    if (!difficulty) {
      throw new BadRequestException(
        'difficulty is required for difficulty type',
      );
    }

    const levels = DIFFICULTY_MAP[difficulty];
    if (!levels) {
      throw new BadRequestException('Invalid difficulty level');
    }

    const questions = await this.getQuestionsWithAntiRepeat(userId, count, {
      difficulty: { in: levels },
    });

    const sessionId = this.createSession(userId, 'difficulty', null, difficulty, questions);

    return {
      sessionId,
      questions: questions.map((q) => ({
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
      })),
    };
  }

  private async startByCollection(
    userId: string,
    collectionId: string,
    _count: number,
  ) {
    if (!collectionId) {
      throw new BadRequestException(
        'collectionId is required for collection type',
      );
    }

    const collection = await this.prisma.collection.findUnique({
      where: { id: collectionId },
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

    if (!collection || collection.status !== 'published') {
      throw new NotFoundException('Collection not found or not published');
    }

    // Check date range
    const now = new Date();
    if (collection.startDate && now < new Date(collection.startDate)) {
      throw new BadRequestException('Collection is not yet available');
    }
    if (collection.endDate && now > new Date(collection.endDate)) {
      throw new BadRequestException('Collection has expired');
    }

    const questions = collection.questions.map((cq) => cq.question);
    const sessionId = this.createSession(
      userId,
      'collection',
      collectionId,
      null,
      questions,
    );

    return {
      sessionId,
      questions: questions.map((q) => ({
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
      })),
    };
  }

  private async getQuestionsWithAntiRepeat(
    userId: string,
    count: number,
    where: Record<string, unknown>,
  ) {
    // Anti-repeat: correct=14 days, incorrect=7 days cooldown (based on last answer)
    const excludedIds = await getExcludedQuestionIds(this.prisma, userId);

    const questions = await this.prisma.question.findMany({
      where: {
        status: 'approved',
        ...where,
        ...(excludedIds.length > 0 ? { NOT: { id: { in: excludedIds } } } : {}),
      },
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

    if (questions.length === 0) {
      throw new NotFoundException(
        'No available questions found matching criteria',
      );
    }

    // Shuffle and take requested count
    for (let i = questions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [questions[i], questions[j]] = [questions[j], questions[i]];
    }

    return questions.slice(0, count);
  }

  private createSession(
    userId: string,
    type: string,
    referenceId: string | null,
    difficulty: string | null,
    questions: { id: string }[],
  ): string {
    // Clean expired sessions
    this.cleanExpiredSessions();

    const sessionId = `ses_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    this.sessions.set(sessionId, {
      userId,
      type,
      referenceId,
      difficulty,
      questionIds: questions.map((q) => q.id),
      createdAt: Date.now(),
    });

    return sessionId;
  }

  private cleanExpiredSessions() {
    const now = Date.now();
    for (const [id, session] of this.sessions) {
      if (now - session.createdAt > SESSION_TTL_MS) {
        this.sessions.delete(id);
      }
    }
  }
}
