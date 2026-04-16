import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { StartCollectionDto } from './dto/start-collection.dto';
import { SubmitCollectionDto } from './dto/submit-collection.dto';
import { SaveProgressDto } from './dto/save-progress.dto';
import { getExcludedQuestionIds } from '@/modules/shared/anti-repeat';
import { updateQuestionStatsBatch } from '@/modules/shared/update-question-stats';

interface StreakState {
  currentStreak: number;
  bestStreak: number;
  currentAnswerStreak: number;
  bestAnswerStreak: number;
}

interface SessionData {
  userId: string;
  type: string;
  referenceId: string | null;
  difficulty: string | null;
  questionIds: string[];
  createdAt: number;
  replay: boolean;
  hasNewQuestions: boolean;
  savedQuestionIds: Set<string>;
  preGameStreak: StreakState | null;
  currentStreakState: StreakState | null;
}

const DIFFICULTY_MAP: Record<string, number[]> = {
  easy: [1, 2],
  medium: [3],
  hard: [4, 5],
};

const SESSION_TTL_MS = 30 * 60 * 1000; // 30 minutes

@Injectable()
export class CollectionsService {
  // TODO: Move to Redis/PostgreSQL for horizontal scaling and persistence across restarts
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

    const answeredCount = await this.prisma.userCollectionItemHistory.count({
      where: { userId, collectionId: id },
    });

    return {
      ...collection,
      answeredCount: Math.min(answeredCount, collection._count.questions),
    };
  }

  async start(userId: string, dto: StartCollectionDto) {
    const count = dto.count;
    const replay = dto.replay ?? false;

    if (dto.type === 'random') {
      return this.startRandom(userId, count ?? 10, replay);
    }
    if (dto.type === 'category') {
      return this.startByCategory(userId, dto.categoryId!, count, replay);
    }
    if (dto.type === 'difficulty') {
      return this.startByDifficulty(userId, dto.difficulty!, count ?? 10, replay);
    }
    if (dto.type === 'collection') {
      return this.startByCollection(userId, dto.collectionId!, count ?? 10, replay);
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

    // If replay mode, skip all recording and return results directly
    if (session.replay) {
      this.sessions.delete(sessionId);
      return {
        correctAnswers,
        totalQuestions: dto.results.length,
        totalTimeSeconds,
        score: 0,
        streak: 0,
        bestStreak: 0,
        replay: true,
      };
    }

    // Get user for streak calculation
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Use currentStreakState (updated by saveProgress) or fall back to DB values.
    // For collection-type sessions, saveProgress does NOT update streaks,
    // so we always start from DB values.
    const streakStart = (session.type !== 'collection' ? session.currentStreakState : null)
      ?? session.preGameStreak
      ?? {
        currentStreak: user.currentStreak,
        bestStreak: user.bestStreak,
        currentAnswerStreak: user.currentAnswerStreak,
        bestAnswerStreak: user.bestAnswerStreak,
      };

    // If all questions in the session were previously answered, skip streak updates
    const shouldUpdateStreak = session.hasNewQuestions;

    // For collection-type sessions, saveProgress doesn't calculate streaks,
    // so we must process ALL results for streak calculation (not just unsaved).
    const streakProcessAll = session.type === 'collection';

    // Calculate streaks and score in a single pass
    let currentStreak = streakStart.currentStreak;
    let bestStreak = streakStart.bestStreak;
    let currentAnswerStreak = streakStart.currentAnswerStreak;
    let bestAnswerStreak = streakStart.bestAnswerStreak;
    let score = 0;
    let submitShieldsUsed = 0;

    const historyData = dto.results.map((r) => {
      let historyScore = 0;
      const isUnsaved = !session.savedQuestionIds.has(r.questionId);
      const shouldProcessStreak = isUnsaved || streakProcessAll;

      if (shouldProcessStreak) {
        // Shield consumed on any answer; protects streak on wrong answer
        // Only consume shields for unsaved results to avoid double-spending
        const hasShield = isUnsaved && r.shieldUsed && (user.shields - submitShieldsUsed) > 0;
        if (hasShield) submitShieldsUsed++;

        if (r.result === 'correct') {
          if (shouldUpdateStreak) {
            currentStreak++;
            currentAnswerStreak++;
          }
          score += 1 + Math.floor(currentAnswerStreak / 5);
          historyScore = 1;
        } else if (hasShield) {
          // Shield protects streak — no reset
        } else {
          if (shouldUpdateStreak) {
            currentStreak = 0;
            currentAnswerStreak = 0;
          }
        }
        if (shouldUpdateStreak) {
          bestStreak = Math.max(bestStreak, currentStreak);
          bestAnswerStreak = Math.max(bestAnswerStreak, currentAnswerStreak);
        }
      } else {
        // Already-saved result from saveProgress (non-collection types)
        if (r.result === 'correct') {
          score += 1 + Math.floor(currentAnswerStreak / 5);
        }
        historyScore = r.result === 'correct' ? 1 : 0;
      }

      return {
        userId,
        questionId: r.questionId,
        result: r.result,
        timeSpentSeconds: r.timeSpentSeconds,
        score: historyScore,
      };
    });

    await this.prisma.$transaction(async (tx) => {
      // Save question history only for non-collection sessions (collection items are not in Question table)
      if (session.type !== 'collection') {
        const newHistoryData = historyData.filter(
          (h) => !session.savedQuestionIds.has(h.questionId),
        );
        const newResults = dto.results.filter(
          (r) => !session.savedQuestionIds.has(r.questionId),
        );
        if (newHistoryData.length > 0) {
          await tx.userQuestionHistory.createMany({ data: newHistoryData });
          await updateQuestionStatsBatch(tx, newResults);
        }
      }

      // Update user stats; use GREATEST for best streaks to prevent
      // overwriting higher values from concurrent saveProgress calls.
      const shieldsDecrement = submitShieldsUsed > 0 ? submitShieldsUsed : 0;
      if (shouldUpdateStreak) {
        await tx.$executeRaw`
          UPDATE "User"
          SET
            "currentStreak" = ${currentStreak},
            "currentAnswerStreak" = ${currentAnswerStreak},
            "bestStreak" = GREATEST("bestStreak", ${bestStreak}),
            "bestAnswerStreak" = GREATEST("bestAnswerStreak", ${bestAnswerStreak}),
            "totalCorrectAnswers" = "totalCorrectAnswers" + ${correctAnswers},
            "totalScore" = "totalScore" + ${score},
            "totalGamesPlayed" = "totalGamesPlayed" + 1,
            "lastPlayedDate" = NOW(),
            "shields" = "shields" - ${shieldsDecrement}
          WHERE "id" = ${userId}
        `;
      } else {
        await tx.$executeRaw`
          UPDATE "User"
          SET
            "totalCorrectAnswers" = "totalCorrectAnswers" + ${correctAnswers},
            "totalScore" = "totalScore" + ${score},
            "totalGamesPlayed" = "totalGamesPlayed" + 1,
            "lastPlayedDate" = NOW(),
            "shields" = "shields" - ${shieldsDecrement}
          WHERE "id" = ${userId}
        `;
      }

      // Record collection progress
      await tx.userCollectionProgress.create({
        data: {
          userId,
          collectionType: session.type,
          referenceId: session.referenceId,
          difficulty: session.difficulty,
          correctAnswers,
          totalQuestions: dto.results.length,
        },
      });
    });

    // Clean up session
    this.sessions.delete(sessionId);

    return {
      correctAnswers,
      totalQuestions: dto.results.length,
      totalTimeSeconds,
      score,
      streak: shouldUpdateStreak ? currentStreak : streakStart.currentStreak,
      bestStreak: shouldUpdateStreak ? bestStreak : streakStart.bestStreak,
    };
  }

  async saveProgress(
    userId: string,
    sessionId: string,
    dto: SaveProgressDto,
  ) {
    const session = this.sessions.get(sessionId);

    if (!session) {
      throw new NotFoundException('Session not found or expired');
    }

    if (session.userId !== userId) {
      throw new BadRequestException('Session does not belong to this user');
    }

    // Refresh session TTL
    session.createdAt = Date.now();

    // Skip recording for replay sessions
    if (session.replay) {
      return { saved: 0 };
    }

    // For collection-type sessions: persist per-question history for resume support
    if (session.type === 'collection') {
      if (session.referenceId) {
        const sessionQuestionIds = new Set(session.questionIds);
        const newResults = dto.results.filter(
          (r) =>
            sessionQuestionIds.has(r.questionId) &&
            !session.savedQuestionIds.has(r.questionId),
        );
        if (newResults.length > 0) {
          await this.prisma.userCollectionItemHistory.createMany({
            data: newResults.map((r) => ({
              userId,
              collectionId: session.referenceId!,
              questionId: r.questionId,
            })),
            skipDuplicates: true,
          });
          for (const r of newResults) {
            session.savedQuestionIds.add(r.questionId);
          }
        }
        return { saved: newResults.length };
      }
      return { saved: 0 };
    }

    // Filter: only save questions that belong to session AND not already saved
    const sessionQuestionIds = new Set(session.questionIds);
    const newResults = dto.results.filter(
      (r) =>
        sessionQuestionIds.has(r.questionId) &&
        !session.savedQuestionIds.has(r.questionId),
    );

    if (newResults.length === 0) {
      return { saved: 0 };
    }

    const historyData = newResults.map((r) => ({
      userId,
      questionId: r.questionId,
      result: r.result,
      timeSpentSeconds: r.timeSpentSeconds,
      score: r.result === 'correct' ? 1 : 0,
    }));

    // Always fetch user for shields balance check
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Capture pre-game streak on first call
    if (!session.preGameStreak) {
      session.preGameStreak = {
        currentStreak: user.currentStreak,
        bestStreak: user.bestStreak,
        currentAnswerStreak: user.currentAnswerStreak,
        bestAnswerStreak: user.bestAnswerStreak,
      };
      session.currentStreakState = { ...session.preGameStreak };
    }

    // Only update streak if the session contains at least one new question
    const shouldUpdateStreak = session.hasNewQuestions;

    let newStreakState = session.currentStreakState!;
    let shieldsUsedCount = 0;
    if (shouldUpdateStreak) {
      // Calculate updated streak from new results
      let { currentStreak, bestStreak, currentAnswerStreak, bestAnswerStreak } =
        session.currentStreakState!;
      for (const r of newResults) {
        // Shield consumed on any answer; protects streak on wrong answer
        const hasShield = r.shieldUsed && (user!.shields - shieldsUsedCount) > 0;
        if (hasShield) shieldsUsedCount++;

        if (r.result === 'correct') {
          currentStreak++;
          currentAnswerStreak++;
        } else if (hasShield) {
          // Shield protects streak
        } else {
          currentStreak = 0;
          currentAnswerStreak = 0;
        }
        bestStreak = Math.max(bestStreak, currentStreak);
        bestAnswerStreak = Math.max(bestAnswerStreak, currentAnswerStreak);
      }
      newStreakState = {
        currentStreak,
        bestStreak,
        currentAnswerStreak,
        bestAnswerStreak,
      };
    }

    // Update session state BEFORE awaiting the transaction so that concurrent
    // saveProgress calls (fire-and-forget from client) read the latest streak
    // and don't re-process the same questions.
    const previousStreakState = session.currentStreakState
      ? { ...session.currentStreakState }
      : null;
    if (shouldUpdateStreak) {
      session.currentStreakState = newStreakState;
    }
    for (const r of newResults) {
      session.savedQuestionIds.add(r.questionId);
    }

    try {
      await this.prisma.$transaction(async (tx) => {
        await tx.userQuestionHistory.createMany({ data: historyData });
        await updateQuestionStatsBatch(tx, newResults);
        const userData: Record<string, unknown> = {};
        if (shouldUpdateStreak) {
          Object.assign(userData, newStreakState);
        }
        if (shieldsUsedCount > 0) {
          userData.shields = { decrement: shieldsUsedCount };
        }
        if (Object.keys(userData).length > 0) {
          await tx.user.update({
            where: { id: userId },
            data: userData,
          });
        }
      });
    } catch (error) {
      // Rollback session state on transaction failure
      if (shouldUpdateStreak && previousStreakState) {
        session.currentStreakState = previousStreakState;
      }
      for (const r of newResults) {
        session.savedQuestionIds.delete(r.questionId);
      }
      throw error;
    }

    return { saved: newResults.length };
  }

  private async startRandom(userId: string, count: number, replay = false) {
    let questions;
    if (replay) {
      // Skip anti-repeat for replay -- fetch random approved questions
      const allQuestions = await this.prisma.question.findMany({
        where: { status: 'approved' },
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
      // Shuffle
      for (let i = allQuestions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [allQuestions[i], allQuestions[j]] = [allQuestions[j], allQuestions[i]];
      }
      questions = allQuestions.slice(0, count);
    } else {
      questions = await this.getQuestionsWithAntiRepeat(userId, count, {});
    }

    const hasNewQuestions = replay
      ? false
      : await this.checkHasNewQuestions(userId, questions.map((q) => q.id));
    const sessionId = this.createSession(userId, 'random', null, null, questions, replay, hasNewQuestions);

    return {
      sessionId,
      questions: questions.map((q) => ({
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
      })),
    };
  }

  private async startByCategory(
    userId: string,
    categoryId: string,
    count?: number,
    replay = false,
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

    let questions;
    if (replay) {
      // Skip anti-repeat for replay — fetch all approved questions in category
      const allQuestions = await this.prisma.question.findMany({
        where: {
          status: 'approved',
          OR: [{ categoryId }, { categories: { some: { categoryId } } }],
        },
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
      // Shuffle
      for (let i = allQuestions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [allQuestions[i], allQuestions[j]] = [allQuestions[j], allQuestions[i]];
      }
      questions = count != null ? allQuestions.slice(0, count) : allQuestions;
    } else {
      questions = await this.getQuestionsWithAntiRepeat(userId, count, {
        OR: [{ categoryId }, { categories: { some: { categoryId } } }],
      });
    }

    const hasNewQuestions = replay
      ? false
      : await this.checkHasNewQuestions(userId, questions.map((q) => q.id));
    const sessionId = this.createSession(userId, 'category', categoryId, null, questions, replay, hasNewQuestions);

    return {
      sessionId,
      questions: questions.map((q) => ({
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
      })),
    };
  }

  private async startByDifficulty(
    userId: string,
    difficulty: string,
    count: number,
    replay = false,
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

    let questions;
    if (replay) {
      // Skip anti-repeat for replay -- fetch all approved questions of this difficulty
      const allQuestions = await this.prisma.question.findMany({
        where: {
          status: 'approved',
          difficulty: { in: levels },
        },
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
      // Shuffle
      for (let i = allQuestions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [allQuestions[i], allQuestions[j]] = [allQuestions[j], allQuestions[i]];
      }
      questions = allQuestions.slice(0, count);
    } else {
      questions = await this.getQuestionsWithAntiRepeat(userId, count, {
        difficulty: { in: levels },
      });
    }

    const hasNewQuestions = replay
      ? false
      : await this.checkHasNewQuestions(userId, questions.map((q) => q.id));
    const sessionId = this.createSession(userId, 'difficulty', null, difficulty, questions, replay, hasNewQuestions);

    return {
      sessionId,
      questions: questions.map((q) => ({
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
      })),
    };
  }

  private async startByCollection(
    userId: string,
    collectionId: string,
    count: number,
    replay = false,
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

    const allItems = collection.questions;

    let items: typeof allItems;
    let effectiveReplay = replay;
    if (replay) {
      items = allItems.slice(0, count);
    } else {
      const answered = await this.prisma.userCollectionItemHistory.findMany({
        where: { userId, collectionId },
        select: { questionId: true },
      });
      const answeredIds = new Set(answered.map((a) => a.questionId));
      const unanswered = allItems.filter((q) => !answeredIds.has(q.id));
      if (unanswered.length > 0) {
        items = unanswered.slice(0, count);
      } else {
        // All answered — treat as replay (skip streak updates)
        items = allItems.slice(0, count);
        effectiveReplay = true;
      }
    }

    const sessionId = this.createSession(
      userId,
      'collection',
      collectionId,
      null,
      items,
      effectiveReplay,
    );

    return {
      sessionId,
      replay: effectiveReplay,
      questions: items.map((item) => ({
        id: item.id,
        statement: item.statement,
        statementEn: item.statementEn,
        isTrue: item.isTrue,
        explanation: item.explanation,
        explanationEn: item.explanationEn,
        source: item.source,
        sourceEn: item.sourceEn,
        sourceUrl: item.sourceUrl,
        sourceUrlEn: item.sourceUrlEn,
        language: item.language,
        categoryId: null,
        difficulty: item.difficulty,
        illustrationUrl: null,
        category: null,
      })),
    };
  }

  private async getQuestionsWithAntiRepeat(
    userId: string,
    count: number | undefined,
    where: Record<string, unknown>,
  ) {
    // Anti-repeat: correct=14 days, incorrect=7 days cooldown (based on last answer)
    const excludedIds = await getExcludedQuestionIds(this.prisma, userId);

    const whereClause = {
      status: 'approved' as const,
      ...where,
      ...(excludedIds.length > 0 ? { NOT: { id: { in: excludedIds } } } : {}),
    };

    // Use count + skip/take for database-side random selection instead of loading all
    const totalCount = await this.prisma.question.count({ where: whereClause });

    if (totalCount === 0) {
      throw new NotFoundException(
        'No available questions found matching criteria',
      );
    }

    const take = count != null ? Math.min(count, totalCount) : totalCount;

    // For small result sets or when requesting all, just fetch and shuffle
    if (totalCount <= take * 2) {
      const questions = await this.prisma.question.findMany({
        where: whereClause,
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

      // Shuffle and take requested count
      for (let i = questions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [questions[i], questions[j]] = [questions[j], questions[i]];
      }

      return count != null ? questions.slice(0, count) : questions;
    }

    // For larger sets, use random skip to avoid loading everything
    const maxSkip = Math.max(0, totalCount - take);
    const randomSkip = Math.floor(Math.random() * (maxSkip + 1));

    const questions = await this.prisma.question.findMany({
      where: whereClause,
      skip: randomSkip,
      take,
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

    // Shuffle for additional randomness within the slice
    for (let i = questions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [questions[i], questions[j]] = [questions[j], questions[i]];
    }

    return questions;
  }

  private createSession(
    userId: string,
    type: string,
    referenceId: string | null,
    difficulty: string | null,
    questions: { id: string }[],
    replay = false,
    hasNewQuestions = true,
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
      replay,
      hasNewQuestions,
      savedQuestionIds: new Set(),
      preGameStreak: null,
      currentStreakState: null,
    });

    return sessionId;
  }

  /**
   * Check if the user has at least one question they've never answered before.
   * Returns true if there is at least one new (never-answered) question.
   */
  private async checkHasNewQuestions(
    userId: string,
    questionIds: string[],
  ): Promise<boolean> {
    if (questionIds.length === 0) return false;

    const previouslyAnswered = await this.prisma.userQuestionHistory.findMany({
      where: {
        userId,
        questionId: { in: questionIds },
      },
      select: { questionId: true },
      distinct: ['questionId'],
    });

    const answeredSet = new Set(previouslyAnswered.map((a) => a.questionId));
    return questionIds.some((id) => !answeredSet.has(id));
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
