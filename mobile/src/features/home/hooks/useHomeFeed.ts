import { useQuery } from '@tanstack/react-query';
import { homeApi } from '../api/homeApi';

export const useHomeFeed = () => {
  return useQuery({
    queryKey: ['home', 'feed'],
    queryFn: homeApi.getFeed,
    staleTime: 2 * 60 * 1000,
    retry: 2,
  });
};
