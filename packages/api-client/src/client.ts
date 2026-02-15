import axios from 'axios';
import type { AxiosInstance, AxiosRequestConfig } from 'axios';
import type { ApiClientOptions } from './types';
import { createUsersEndpoints } from './endpoints/users';
import { createQuestionsEndpoints } from './endpoints/questions';
import { createDailySetsEndpoints } from './endpoints/daily-sets';
import { createLeaderboardEndpoints } from './endpoints/leaderboard';
import { createCategoriesEndpoints } from './endpoints/categories';
import { createAdminEndpoints } from './endpoints/admin';

export function createApiClient(baseUrl: string, options: ApiClientOptions = {}) {
  const instance: AxiosInstance = axios.create({
    baseURL: baseUrl,
    timeout: 15000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  instance.interceptors.request.use((config) => {
    if (options.deviceId) {
      config.headers['x-device-id'] = options.deviceId;
    }
    if (options.accessToken) {
      config.headers['Authorization'] = `Bearer ${options.accessToken}`;
    }
    return config;
  });

  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        options.onTokenExpired?.();
      }
      return Promise.reject(error);
    },
  );

  const setDeviceId = (deviceId: string) => {
    options.deviceId = deviceId;
  };

  const setAccessToken = (token: string | undefined) => {
    options.accessToken = token;
  };

  return {
    instance,
    setDeviceId,
    setAccessToken,
    users: createUsersEndpoints(instance),
    questions: createQuestionsEndpoints(instance),
    dailySets: createDailySetsEndpoints(instance),
    leaderboard: createLeaderboardEndpoints(instance),
    categories: createCategoriesEndpoints(instance),
    admin: createAdminEndpoints(instance),
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;

export function unwrapResponse<T>(response: { data: { data: T } }): T {
  return response.data.data;
}

export async function apiRequest<T>(
  request: Promise<{ data: T }>,
): Promise<T> {
  const response = await request;
  return response.data;
}
