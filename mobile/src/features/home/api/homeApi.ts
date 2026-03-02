import { apiClient } from '@/services/api';
import type { HomeFeed } from '@/shared';

export const homeApi = {
  async getFeed(): Promise<HomeFeed> {
    const response = await apiClient.get<{ data: HomeFeed }>('/v1/home/feed');
    return response.data.data;
  },
};
