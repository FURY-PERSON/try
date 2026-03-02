import { apiClient } from '@/services/api';
import type { User } from '@/shared';

type UserResponse = {
  data: User;
};

type StatsResponse = {
  data: {
    totalScore: number;
    totalCorrectAnswers: number;
    factsLearned: number;
    currentStreak: number;
    bestStreak: number;
    totalGames: number;
    correctPercent: number;
    avgScore: number;
    activityMap: Record<string, number>;
  };
};

export const profileApi = {
  async register(deviceId: string, nickname?: string): Promise<User> {
    const response = await apiClient.post<UserResponse>('/v1/users/register', {
      deviceId,
      nickname,
    });
    return response.data.data;
  },

  async getProfile(): Promise<User> {
    const response = await apiClient.get<UserResponse>('/v1/users/me');
    return response.data.data;
  },

  async updateProfile(data: { nickname?: string; avatarEmoji?: string }): Promise<User> {
    const response = await apiClient.patch<UserResponse>('/v1/users/me', data);
    return response.data.data;
  },

  async regenerateNickname(): Promise<User> {
    const response = await apiClient.post<UserResponse>('/v1/users/me/nickname/regenerate');
    return response.data.data;
  },

  async getStats(): Promise<StatsResponse['data']> {
    const response = await apiClient.get<StatsResponse>('/v1/users/me/stats');
    return response.data.data;
  },
};
