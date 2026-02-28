import { PrismaService } from '@/prisma/prisma.service';

const CORRECT_COOLDOWN_DAYS = 14;
const INCORRECT_COOLDOWN_DAYS = 7;

/**
 * Returns IDs of questions that should be excluded from selection for a user
 * based on their recent answer history.
 *
 * - Correctly answered: excluded for 14 days from last answer
 * - Incorrectly answered: excluded for 7 days from last answer
 * - Uses the MOST RECENT answer per question via PostgreSQL DISTINCT ON
 */
export async function getExcludedQuestionIds(
  prisma: PrismaService,
  userId: string,
): Promise<string[]> {
  const correctCutoff = new Date();
  correctCutoff.setDate(correctCutoff.getDate() - CORRECT_COOLDOWN_DAYS);

  const incorrectCutoff = new Date();
  incorrectCutoff.setDate(incorrectCutoff.getDate() - INCORRECT_COOLDOWN_DAYS);

  // Use DISTINCT ON to get the latest answer per question in a single query,
  // then filter by result + answeredAt to determine exclusion
  const excluded = await prisma.$queryRaw<{ questionId: string }[]>`
    SELECT "questionId"
    FROM (
      SELECT DISTINCT ON ("questionId") "questionId", "result", "answeredAt"
      FROM "UserQuestionHistory"
      WHERE "userId" = ${userId}
        AND "answeredAt" >= ${correctCutoff}
      ORDER BY "questionId", "answeredAt" DESC
    ) latest
    WHERE
      ("result" = 'correct' AND "answeredAt" >= ${correctCutoff})
      OR ("result" = 'incorrect' AND "answeredAt" >= ${incorrectCutoff})
  `;

  return excluded.map((r) => r.questionId);
}

/**
 * Returns all distinct questionIds a user has ever answered (no cooldown).
 * Limited to last 90 days for performance.
 */
export async function getAllAnsweredQuestionIds(
  prisma: PrismaService,
  userId: string,
): Promise<string[]> {
  // Limit to last 90 days to bound the query size
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 90);

  const records = await prisma.userQuestionHistory.findMany({
    where: { userId, answeredAt: { gte: cutoff } },
    select: { questionId: true },
    distinct: ['questionId'],
  });
  return records.map((r) => r.questionId);
}
