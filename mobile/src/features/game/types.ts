export type CardResult = {
  questionId: string;
  correct: boolean;
  score: number;
  timeSpentMs: number;
};

export type DailySetProgress = {
  dailySetId: string | null;
  currentCardIndex: number;
  totalCards: number;
  results: CardResult[];
  completed: boolean;
};

export type SwipeDirection = 'left' | 'right';

export type FactOfDay = {
  questionId: string;
  statement: string;
  statementEn: string;
  isTrue: boolean;
  wrongPercent: number;
  userCorrect: boolean;
};

export type SubmissionResult = {
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  totalTimeSeconds: number;
  streak: number;
  bestStreak: number;
  leaderboardPosition: number;
  correctPercent: number;
  percentile: number;
  totalPlayers: number;
  factOfDay?: FactOfDay | null;
};
