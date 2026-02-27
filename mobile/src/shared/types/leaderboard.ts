export type LeaderboardEntry = {
  rank: number;
  userId: string;
  nickname: string | null;
  avatarEmoji: string | null;
  correctAnswers: number;
  totalQuestions: number;
  score: number;
  totalTimeSeconds: number;
  currentStreak?: number;
  bestStreak?: number;
};

export type LeaderboardResponse = {
  entries: LeaderboardEntry[];
  userPosition: number | null;
  totalPlayers: number;
  userContext?: LeaderboardEntry[];
  currentUserId?: string;
};

export type LeaderboardMode = 'score' | 'streak';

export type LeaderboardPeriod = 'weekly' | 'monthly' | 'yearly' | 'alltime';
