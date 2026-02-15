import { apiClient } from '@/services/api';
import type { LeaderboardEntry } from '@wordpulse/shared';

type LeaderboardResponse = {
  data: LeaderboardEntry[];
};

type LeaderboardPeriod = 'daily' | 'weekly' | 'alltime';

export const leaderboardApi = {
  async getLeaderboard(period: LeaderboardPeriod): Promise<LeaderboardEntry[]> {
    const response = await apiClient.get<LeaderboardResponse>(`/leaderboard/${period}`);
    return response.data.data;
  },
};
