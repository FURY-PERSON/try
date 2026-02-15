export const shuffleArray = <T>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = shuffled[i];
    shuffled[i] = shuffled[j] as T;
    shuffled[j] = temp as T;
  }
  return shuffled;
};

export const calculateGameScore = (
  correct: boolean,
  timeSpentMs: number,
  hintUsed: boolean,
): number => {
  if (!correct) return 0;

  let score = 100;

  // Time bonus: up to 50 extra points for fast answers (under 10s)
  if (timeSpentMs < 10_000) {
    score += Math.round(50 * (1 - timeSpentMs / 10_000));
  }

  // Hint penalty
  if (hintUsed) {
    score = Math.round(score * 0.5);
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
