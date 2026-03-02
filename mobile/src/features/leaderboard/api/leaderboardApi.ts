import { apiClient } from '@/services/api';
import type { LeaderboardResponse, LeaderboardPeriod, LeaderboardMode } from '@/shared';

type ApiLeaderboardResponse = {
  data: LeaderboardResponse;
};

export const leaderboardApi = {
  async getLeaderboard(
    period: LeaderboardPeriod,
    mode: LeaderboardMode = 'score',
  ): Promise<LeaderboardResponse> {
    if (mode === 'streak') {
      const periodParam = period ? `?period=${period}` : '';
      const response = await apiClient.get<ApiLeaderboardResponse>(`/v1/leaderboard/streak${periodParam}`);
      return response.data.data;
    }
    const response = await apiClient.get<ApiLeaderboardResponse>(
      `/v1/leaderboard/${period}?type=${mode}`,
    );
    return response.data.data;
  },
};
