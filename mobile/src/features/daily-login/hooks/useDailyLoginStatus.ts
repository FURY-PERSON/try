import { useQuery } from '@tanstack/react-query';
import { dailyLoginApi } from '../api/dailyLoginApi';
import type { DailyLoginStatus } from '../types';

export function useDailyLoginStatus() {
  return useQuery<DailyLoginStatus>({
    queryKey: ['daily-login', 'status'],
    queryFn: () => dailyLoginApi.getStatus(),
    staleTime: 60_000,
  });
}
