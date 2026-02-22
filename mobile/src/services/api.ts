import axios from 'axios';
import { API_URL } from '@/constants/config';
import { useAppStore } from '@/stores/useAppStore';

export const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 15_000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const deviceId = useAppStore.getState().deviceId;
  if (deviceId) {
    config.headers['X-Device-Id'] = deviceId;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error)) {
      const message = error.response?.data?.message ?? error.message;
      return Promise.reject(new Error(message));
    }
    return Promise.reject(error);
  },
);
