import { apiClient } from '@/services/api';
import type { UseShieldResponse, RewardShieldResponse } from '../types';

export const shieldsApi = {
  async useShield(questionId: string): Promise<UseShieldResponse> {
    const response = await apiClient.post<{ data: UseShieldResponse }>(
      '/v1/shields/use',
      { questionId },
    );
    return response.data.data;
  },

  async rewardShield(): Promise<RewardShieldResponse> {
    const response = await apiClient.post<{ data: RewardShieldResponse }>(
      '/v1/shields/reward',
      { source: 'rewarded_video' },
    );
    return response.data.data;
  },
};
