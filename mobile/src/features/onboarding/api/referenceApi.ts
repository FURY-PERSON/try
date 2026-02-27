import { apiClient } from '@/services/api';

type NicknameOptions = {
  placeholder: string;
  emoji: string;
};

type AvatarEmojisResponse = Record<string, string[]>;

export const referenceApi = {
  async getNicknameOptions(language: string = 'ru'): Promise<NicknameOptions> {
    const response = await apiClient.get<{ data: NicknameOptions }>(
      `/api/v1/reference/nickname-options?language=${language}`,
    );
    return response.data.data;
  },

  async getAvatarEmojis(): Promise<AvatarEmojisResponse> {
    const response = await apiClient.get<{ data: AvatarEmojisResponse }>(
      '/api/v1/reference/avatar-emojis',
    );
    return response.data.data;
  },
};
