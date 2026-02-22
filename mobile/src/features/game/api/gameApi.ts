import { apiClient } from '@/services/api';
import type { DailySet, Question } from '@/shared';

type DailySetResponse = {
  data: DailySet;
};

type SubmitAnswerResponse = {
  data: {
    correct: boolean;
    score: number;
    fact: string;
    factSource: string;
    factSourceUrl?: string;
    illustrationUrl?: string;
  };
};

type RandomQuestionResponse = {
  data: Question;
};

export const gameApi = {
  async getTodaySet(): Promise<DailySet> {
    const response = await apiClient.get<DailySetResponse>('/api/v1/daily-sets/today');
    return response.data.data;
  },

  async submitAnswer(
    questionId: string,
    result: 'correct' | 'incorrect',
    timeSpentSeconds: number,
  ): Promise<SubmitAnswerResponse['data']> {
    const response = await apiClient.post<SubmitAnswerResponse>(
      `/api/v1/questions/${questionId}/answer`,
      { result, timeSpentSeconds },
    );
    return response.data.data;
  },

  async getRandomQuestion(type?: string, language?: string): Promise<Question> {
    const params: Record<string, string> = {};
    if (type) params.type = type;
    if (language) params.language = language;
    const response = await apiClient.get<RandomQuestionResponse>('/api/v1/questions/random', {
      params,
    });
    return response.data.data;
  },
};
