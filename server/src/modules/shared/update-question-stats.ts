import { Prisma } from '@prisma/client';

type TxClient = Prisma.TransactionClient;

interface AnswerResult {
  questionId: string;
  result: string;
  timeSpentSeconds: number;
}

/**
 * Atomically updates question stats (timesShown, timesCorrect, avgTimeSeconds)
 * using raw SQL to avoid race conditions.
 * Processes all answers in parallel without pre-fetching questions.
 */
export async function updateQuestionStatsBatch(
  tx: TxClient,
  results: AnswerResult[],
): Promise<void> {
  if (results.length === 0) return;

  await Promise.all(
    results.map((r) => {
      const correctIncrement = r.result === 'correct' ? 1 : 0;
      return (tx as any).$executeRaw`
        UPDATE "Question"
        SET
          "avgTimeSeconds" = ("avgTimeSeconds" * "timesShown" + ${r.timeSpentSeconds}::float) / ("timesShown" + 1),
          "timesShown" = "timesShown" + 1,
          "timesCorrect" = "timesCorrect" + ${correctIncrement}
        WHERE "id" = ${r.questionId}
      `;
    }),
  );
}
