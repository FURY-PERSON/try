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
 * Processes all answers sequentially within the provided transaction.
 */
export async function updateQuestionStatsBatch(
  tx: TxClient,
  results: AnswerResult[],
): Promise<void> {
  if (results.length === 0) return;

  // Execute sequentially within the transaction to avoid N parallel UPDATE statements
  for (const r of results) {
    const correctIncrement = r.result === 'correct' ? 1 : 0;
    await (tx as any).$executeRaw`
      UPDATE "Question"
      SET
        "avgTimeSeconds" = ("avgTimeSeconds" * "timesShown" + ${r.timeSpentSeconds}::float) / ("timesShown" + 1),
        "timesShown" = "timesShown" + 1,
        "timesCorrect" = "timesCorrect" + ${correctIncrement}
      WHERE "id" = ${r.questionId}
    `;
  }
}
