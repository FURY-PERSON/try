import { apiClient } from '@/services/api';
import type { LeaderboardResponse } from '@/shared';

type LeaderboardPeriod = 'weekly' | 'monthly' | 'yearly' | 'alltime';

type ApiLeaderboardResponse = {
  data: LeaderboardResponse;
};

export const leaderboardApi = {
  async getLeaderboard(period: LeaderboardPeriod): Promise<LeaderboardResponse> {
    const response = await apiClient.get<ApiLeaderboardResponse>(`/api/v1/leaderboard/${period}`);
    return response.data.data;
  },
};
