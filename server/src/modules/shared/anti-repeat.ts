import { PrismaService } from '@/prisma/prisma.service';

const CORRECT_COOLDOWN_DAYS = 14;
const INCORRECT_COOLDOWN_DAYS = 7;

/**
 * Returns IDs of questions that should be excluded from selection for a user
 * based on their recent answer history.
 *
 * - Correctly answered: excluded for 14 days from last answer
 * - Incorrectly answered: excluded for 7 days from last answer
 * - Uses the MOST RECENT answer per question
 */
export async function getExcludedQuestionIds(
  prisma: PrismaService,
  userId: string,
): Promise<string[]> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - CORRECT_COOLDOWN_DAYS);

  const recentHistory = await prisma.userQuestionHistory.findMany({
    where: {
      userId,
      answeredAt: { gte: cutoffDate },
    },
    select: {
      questionId: true,
      result: true,
      answeredAt: true,
    },
    orderBy: { answeredAt: 'desc' },
  });

  // Keep only the latest answer per question
  const latestByQuestion = new Map<
    string,
    { result: string; answeredAt: Date }
  >();
  for (const entry of recentHistory) {
    if (!latestByQuestion.has(entry.questionId)) {
      latestByQuestion.set(entry.questionId, {
        result: entry.result,
        answeredAt: entry.answeredAt,
      });
    }
  }

  const now = Date.now();
  const excludedIds: string[] = [];
  const incorrectCutoffMs = INCORRECT_COOLDOWN_DAYS * 24 * 60 * 60 * 1000;
  const correctCutoffMs = CORRECT_COOLDOWN_DAYS * 24 * 60 * 60 * 1000;

  for (const [questionId, latest] of latestByQuestion) {
    const elapsed = now - latest.answeredAt.getTime();

    if (latest.result === 'correct' && elapsed < correctCutoffMs) {
      excludedIds.push(questionId);
    } else if (latest.result === 'incorrect' && elapsed < incorrectCutoffMs) {
      excludedIds.push(questionId);
    }
  }

  return excludedIds;
}

/**
 * Returns all distinct questionIds a user has ever answered (no cooldown).
 */
export async function getAllAnsweredQuestionIds(
  prisma: PrismaService,
  userId: string,
): Promise<string[]> {
  const records = await prisma.userQuestionHistory.findMany({
    where: { userId },
    select: { questionId: true },
    distinct: ['questionId'],
  });
  return records.map((r) => r.questionId);
}
