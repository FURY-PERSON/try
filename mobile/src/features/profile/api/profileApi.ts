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
    activityMap: Record<string, number>;
  };
};

export const profileApi = {
  async register(deviceId: string, nickname?: string): Promise<User> {
    const response = await apiClient.post<UserResponse>('/api/v1/users/register', {
      deviceId,
      nickname,
    });
    return response.data.data;
  },

  async getProfile(): Promise<User> {
    const response = await apiClient.get<UserResponse>('/api/v1/users/me');
    return response.data.data;
  },

  async updateProfile(data: { nickname?: string; avatarEmoji?: string }): Promise<User> {
    const response = await apiClient.patch<UserResponse>('/api/v1/users/me', data);
    return response.data.data;
  },

  async getStats(): Promise<StatsResponse['data']> {
    const response = await apiClient.get<StatsResponse>('/api/v1/users/me/stats');
    return response.data.data;
  },
};
