export type LeaderboardEntry = {
  rank: number;
  userId: string;
  nickname: string | null;
  avatarEmoji: string | null;
  correctAnswers: number;
  totalQuestions: number;
  score: number;
  totalTimeSeconds: number;
};

export type LeaderboardResponse = {
  entries: LeaderboardEntry[];
  userPosition: number | null;
  totalPlayers: number;
};
