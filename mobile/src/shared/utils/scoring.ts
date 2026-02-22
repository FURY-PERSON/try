const BASE_SCORE = 100;
const TIME_BONUS_THRESHOLD_SECONDS = 30;
const DIFFICULTY_MULTIPLIER = 0.2;

export function calculateScore(
  isCorrect: boolean,
  difficulty: number,
  timeSpentSeconds: number,
): number {
  if (!isCorrect) return 0;

  const difficultyBonus = BASE_SCORE * (1 + (difficulty - 1) * DIFFICULTY_MULTIPLIER);
  const timeBonus =
    timeSpentSeconds < TIME_BONUS_THRESHOLD_SECONDS
      ? Math.round((TIME_BONUS_THRESHOLD_SECONDS - timeSpentSeconds) * 2)
      : 0;

  return Math.round(difficultyBonus + timeBonus);
}

export function calculateDailySetScore(
  results: { isCorrect: boolean; difficulty: number; timeSpentSeconds: number }[],
): number {
  return results.reduce(
    (total, r) => total + calculateScore(r.isCorrect, r.difficulty, r.timeSpentSeconds),
    0,
  );
}
