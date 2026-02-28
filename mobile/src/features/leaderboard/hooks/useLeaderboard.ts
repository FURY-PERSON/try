import { useQuery } from '@tanstack/react-query';
import { leaderboardApi } from '../api/leaderboardApi';
import type { LeaderboardPeriod, LeaderboardMode } from '@/shared';

export const useLeaderboard = (period: LeaderboardPeriod, mode: LeaderboardMode = 'score') => {
  return useQuery({
    queryKey: ['leaderboard', mode, period],
    queryFn: () => leaderboardApi.getLeaderboard(period, mode),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};
