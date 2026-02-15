import type { AxiosInstance } from 'axios';
import type { User, UserStats, ApiResponse } from '@wordpulse/shared';
import type { RegisterUserDto, UpdateUserDto } from '../types';

export function createUsersEndpoints(http: AxiosInstance) {
  return {
    register(dto: RegisterUserDto) {
      return http.post<ApiResponse<User>>('/api/v1/users/register', dto);
    },

    updateMe(dto: UpdateUserDto) {
      return http.patch<ApiResponse<User>>('/api/v1/users/me', dto);
    },

    getMyStats() {
      return http.get<ApiResponse<UserStats>>('/api/v1/users/me/stats');
    },
  };
}
