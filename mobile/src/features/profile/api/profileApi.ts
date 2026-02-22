import { apiClient } from '@/services/api';
import type { User } from '@/shared';

type UserResponse = {
  data: User;
};

type StatsResponse = {
  data: {
    totalGames: number;
    correctPercent: number;
    bestStreak: number;
    avgScore: number;
    activityMap: Record<string, boolean>;
  };
};

export const profileApi = {
  async register(deviceId: string, nickname?: string): Promise<User> {
    const response = await apiClient.post<UserResponse>('/users/register', {
      deviceId,
      nickname,
    });
    return response.data.data;
  },

  async getProfile(): Promise<User> {
    const response = await apiClient.get<UserResponse>('/users/me');
    return response.data.data;
  },

  async updateProfile(data: { nickname?: string }): Promise<User> {
    const response = await apiClient.patch<UserResponse>('/users/me', data);
    return response.data.data;
  },

  async getStats(): Promise<StatsResponse['data']> {
    const response = await apiClient.get<StatsResponse>('/users/me/stats');
    return response.data.data;
  },
};
