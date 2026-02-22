import type { AxiosInstance } from 'axios';
import type { LeaderboardResponse, ApiResponse } from '../../shared';

export function createLeaderboardEndpoints(http: AxiosInstance) {
  return {
    getDaily(date?: string) {
      return http.get<ApiResponse<LeaderboardResponse>>('/api/v1/leaderboard/daily', {
        params: date ? { date } : undefined,
      });
    },

    getWeekly() {
      return http.get<ApiResponse<LeaderboardResponse>>('/api/v1/leaderboard/weekly');
    },

    getAllTime() {
      return http.get<ApiResponse<LeaderboardResponse>>('/api/v1/leaderboard/alltime');
    },
  };
}
