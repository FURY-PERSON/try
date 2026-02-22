import type { AxiosInstance } from 'axios';
import type { Category, ApiResponse } from '../../shared';

export function createCategoriesEndpoints(http: AxiosInstance) {
  return {
    getAll() {
      return http.get<ApiResponse<Category[]>>('/api/v1/categories');
    },
  };
}
