export const calculateCardScore = (
  correct: boolean,
  timeSpentMs: number,
): number => {
  if (!correct) return 0;

  let score = 100;

  // Time bonus: up to 50 extra points for fast answers (under 10s)
  if (timeSpentMs < 10_000) {
    score += Math.round(50 * (1 - timeSpentMs / 10_000));
  }

  return score;
};

export const getResultMessage = (score: number, total: number): string => {
  const ratio = score / total;
  if (ratio === 1) return 'excellent';
  if (ratio >= 0.8) return 'good';
  if (ratio >= 0.5) return 'okay';
  return 'tryAgain';
};
