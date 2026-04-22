import { apiClient } from '@/services/api';
import type { DailyLoginResponse, DailyLoginStatus } from '../types';

function formatLocalDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export const dailyLoginApi = {
  async claim(): Promise<DailyLoginResponse> {
    const response = await apiClient.post<{ data: DailyLoginResponse }>(
      '/v1/users/me/daily-login/claim',
      { localDate: formatLocalDate(new Date()) },
    );
    return response.data.data;
  },

  async getStatus(): Promise<DailyLoginStatus> {
    const localDate = formatLocalDate(new Date());
    const response = await apiClient.get<{ data: DailyLoginStatus }>(
      `/v1/users/me/daily-login/status?localDate=${localDate}`,
    );
    return response.data.data;
  },
};

export { formatLocalDate };
