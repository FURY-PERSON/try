import axios from 'axios';
import type { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
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

  // Separate instance for refresh requests to avoid interceptor recursion
  const refreshInstance = axios.create({
    baseURL: baseUrl,
    timeout: 15000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  let isRefreshing = false;
  let failedQueue: {
    resolve: (token: string) => void;
    reject: (error: unknown) => void;
  }[] = [];

  const processQueue = (error: unknown, token: string | null) => {
    failedQueue.forEach((p) => {
      if (token) {
        p.resolve(token);
      } else {
        p.reject(error);
      }
    });
    failedQueue = [];
  };

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
    async (error) => {
      const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

      if (!axios.isAxiosError(error) || error.response?.status !== 401) {
        return Promise.reject(error);
      }

      // Only handle token expiry for authenticated requests (not login attempts)
      const hasAuth = originalRequest?.headers?.['Authorization'];
      if (!hasAuth) {
        return Promise.reject(error);
      }

      // Don't retry if we already tried refreshing for this request
      if (originalRequest._retry) {
        options.onTokenExpired?.();
        return Promise.reject(error);
      }

      // No refresh token available — logout immediately
      if (!options.refreshToken) {
        options.onTokenExpired?.();
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // Queue the request while refresh is in progress
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers['Authorization'] = `Bearer ${token}`;
          return instance(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const res = await refreshInstance.post('/admin/auth/refresh', {
          refreshToken: options.refreshToken,
        });

        const newAccessToken: string = res.data.data.accessToken;
        options.onTokenRefreshed?.(newAccessToken);
        processQueue(null, newAccessToken);

        originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
        return instance(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        options.onTokenExpired?.();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
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
