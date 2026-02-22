export type LeaderboardEntry = {
  id: string;
  userId: string;
  dailySetId: string;
  score: number;
  correctAnswers: number;
  totalTimeSeconds: number;
  createdAt: string;
  user: {
    nickname: string | null;
  };
};

export type LeaderboardResponse = {
  entries: LeaderboardEntry[];
  userPosition: number | null;
  totalPlayers: number;
};
