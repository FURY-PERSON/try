import { createApiClient } from '@/api-client';
import { useAuthStore } from '@/stores/useAuthStore';

const baseUrl = import.meta.env.VITE_API_URL || '';

export const api = createApiClient(baseUrl, {
  get accessToken() {
    return useAuthStore.getState().accessToken ?? undefined;
  },
  get refreshToken() {
    return useAuthStore.getState().refreshToken ?? undefined;
  },
  onTokenRefreshed(accessToken: string) {
    const store = useAuthStore.getState();
    if (store.refreshToken) {
      store.setTokens(accessToken, store.refreshToken);
    }
  },
  onTokenExpired() {
    useAuthStore.getState().logout();
    window.location.href = '/login';
  },
});
