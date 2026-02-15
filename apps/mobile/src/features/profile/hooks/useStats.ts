import { useQuery } from '@tanstack/react-query';
import { profileApi } from '../api/profileApi';

export const useStats = () => {
  return useQuery({
    queryKey: ['user', 'stats'],
    queryFn: profileApi.getStats,
    staleTime: 5 * 60 * 1000,
  });
};
