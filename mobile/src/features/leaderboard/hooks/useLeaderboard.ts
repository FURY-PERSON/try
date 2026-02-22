import { useQuery } from '@tanstack/react-query';
import { leaderboardApi } from '../api/leaderboardApi';

type LeaderboardPeriod = 'weekly' | 'monthly' | 'yearly' | 'alltime';

export const useLeaderboard = (period: LeaderboardPeriod) => {
  return useQuery({
    queryKey: ['leaderboard', period],
    queryFn: () => leaderboardApi.getLeaderboard(period),
    staleTime: 2 * 60 * 1000,
  });
};
