import type { AxiosInstance } from 'axios';
import type { Question, ApiResponse } from '../../shared';
import type { QuestionFilterDto, AnswerQuestionDto, AnswerResult } from '../types';

export function createQuestionsEndpoints(http: AxiosInstance) {
  return {
    getRandom(params?: QuestionFilterDto) {
      return http.get<ApiResponse<Question>>('/api/v1/questions/random', { params });
    },

    submitAnswer(questionId: string, dto: AnswerQuestionDto) {
      return http.post<ApiResponse<AnswerResult>>(
        `/api/v1/questions/${questionId}/answer`,
        dto,
      );
    },
  };
}
