import { apiClient } from '@/services/api';

type NicknameOptions = {
  placeholder: string;
  emoji: string;
};

type AvatarEmojisResponse = Record<string, string[]>;

export const referenceApi = {
  async getNicknameOptions(language: string = 'ru'): Promise<NicknameOptions> {
    const response = await apiClient.get<NicknameOptions>(
      `/api/v1/reference/nickname-options?language=${language}`,
    );
    return response.data;
  },

  async getAvatarEmojis(): Promise<AvatarEmojisResponse> {
    const response = await apiClient.get<AvatarEmojisResponse>(
      '/api/v1/reference/avatar-emojis',
    );
    return response.data;
  },
};
