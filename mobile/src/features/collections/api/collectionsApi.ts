import { apiClient } from '@/services/api';
import type { CollectionSession, CollectionSubmitResult } from '@/shared';

type StartParams = {
  type: 'category' | 'difficulty' | 'collection';
  categoryId?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  collectionId?: string;
  count?: number;
};

type GameResult = {
  questionId: string;
  result: 'correct' | 'incorrect';
  timeSpentSeconds: number;
};

export const collectionsApi = {
  async start(params: StartParams): Promise<CollectionSession> {
    const response = await apiClient.post<{ data: CollectionSession }>(
      '/api/v1/collections/start',
      params,
    );
    return response.data.data;
  },

  async submit(
    sessionId: string,
    results: GameResult[],
  ): Promise<CollectionSubmitResult> {
    const response = await apiClient.post<{ data: CollectionSubmitResult }>(
      `/api/v1/collections/${sessionId}/submit`,
      { results },
    );
    return response.data.data;
  },
};
