import { apiClient } from '@/services/api';
import type { DailySetWithQuestions } from '@/shared';
import type { SubmissionResult } from '../types';

type DailySetResponse = {
  data: DailySetWithQuestions;
};

type SubmitAnswerResponse = {
  data: {
    correct: boolean;
    score: number;
    isTrue: boolean;
    explanation: string;
    explanationEn: string;
    source: string;
    sourceEn: string;
    sourceUrl?: string;
    sourceUrlEn?: string;
  };
};

type SubmitDailySetResponse = {
  data: SubmissionResult;
};

type GameResult = {
  questionId: string;
  result: 'correct' | 'incorrect';
  timeSpentSeconds: number;
};

export const gameApi = {
  async getTodaySet(): Promise<DailySetWithQuestions> {
    const response = await apiClient.get<DailySetResponse>('/v1/daily-sets/today');
    return response.data.data;
  },

  async submitAnswer(
    questionId: string,
    userAnswer: boolean,
    timeSpentSeconds: number,
    useShield?: boolean,
  ): Promise<SubmitAnswerResponse['data']> {
    const response = await apiClient.post<SubmitAnswerResponse>(
      `/v1/questions/${questionId}/answer`,
      { userAnswer, timeSpentSeconds, ...(useShield ? { useShield: true } : {}) },
    );
    return response.data.data;
  },

  async submitDailySet(
    dailySetId: string,
    results: GameResult[],
  ): Promise<SubmissionResult> {
    const response = await apiClient.post<SubmitDailySetResponse>(
      `/v1/daily-sets/${dailySetId}/submit`,
      { results },
    );
    return response.data.data;
  },
};
