import { apiClient } from '@/services/api';
import type { CollectionSummary, CollectionSession, CollectionSubmitResult } from '@/shared';

type CollectionListItem = CollectionSummary & { completed: boolean };

type CollectionDetail = CollectionSummary & {
  startDate: string | null;
  endDate: string | null;
  completed: boolean;
  lastResult: {
    correctAnswers: number;
    totalQuestions: number;
    completedAt: string;
  } | null;
};

type StartParams = {
  type: 'category' | 'difficulty' | 'collection' | 'random';
  categoryId?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  collectionId?: string;
  count?: number;
  replay?: boolean;
};

type GameResult = {
  questionId: string;
  result: 'correct' | 'incorrect';
  timeSpentSeconds: number;
};

export type { CollectionListItem, CollectionDetail };

export const collectionsApi = {
  async getList(): Promise<CollectionListItem[]> {
    const response = await apiClient.get<{ data: CollectionListItem[] }>(
      '/v1/collections',
    );
    return response.data.data;
  },

  async getById(id: string): Promise<CollectionDetail> {
    const response = await apiClient.get<{ data: CollectionDetail }>(
      `/v1/collections/${id}`,
    );
    return response.data.data;
  },

  async start(params: StartParams): Promise<CollectionSession> {
    const response = await apiClient.post<{ data: CollectionSession }>(
      '/v1/collections/start',
      params,
    );
    return response.data.data;
  },

  async submit(
    sessionId: string,
    results: GameResult[],
  ): Promise<CollectionSubmitResult> {
    const response = await apiClient.post<{ data: CollectionSubmitResult }>(
      `/v1/collections/${sessionId}/submit`,
      { results },
    );
    return response.data.data;
  },

  async saveProgress(
    sessionId: string,
    results: GameResult[],
  ): Promise<{ saved: number }> {
    const response = await apiClient.post<{ data: { saved: number } }>(
      `/v1/collections/${sessionId}/progress`,
      { results },
    );
    return response.data.data;
  },
};
