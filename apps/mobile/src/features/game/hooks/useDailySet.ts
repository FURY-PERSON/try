import { useQuery } from '@tanstack/react-query';
import { gameApi } from '../api/gameApi';

export const useDailySet = () => {
  return useQuery({
    queryKey: ['dailySet', 'today'],
    queryFn: gameApi.getTodaySet,
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });
};
