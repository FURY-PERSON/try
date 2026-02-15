import type { AxiosInstance } from 'axios';
import type { Category, ApiResponse } from '@wordpulse/shared';

export function createCategoriesEndpoints(http: AxiosInstance) {
  return {
    getAll() {
      return http.get<ApiResponse<Category[]>>('/api/v1/categories');
    },
  };
}
