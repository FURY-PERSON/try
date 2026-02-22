import type { AxiosInstance } from 'axios';
import type { DailySetWithQuestions, ApiResponse } from '../../shared';
import type { SubmitDailySetDto } from '../types';

export function createDailySetsEndpoints(http: AxiosInstance) {
  return {
    getToday() {
      return http.get<ApiResponse<DailySetWithQuestions>>('/api/v1/daily-sets/today');
    },

    submit(dailySetId: string, dto: SubmitDailySetDto) {
      return http.post<ApiResponse<{ score: number; position: number }>>(
        `/api/v1/daily-sets/${dailySetId}/submit`,
        dto,
      );
    },
  };
}
