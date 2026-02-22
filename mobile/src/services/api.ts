import { API_URL } from '@/constants/config';
import { useAppStore } from '@/stores/useAppStore';

class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

type ApiResponse<T> = {
  data: T;
};

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<ApiResponse<T>> {
  const deviceId = useAppStore.getState().deviceId;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (deviceId) {
    headers['X-Device-Id'] = deviceId;
  }

  const url = `${API_URL}${path}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15_000);

  try {
    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    const json = await response.json();

    if (!response.ok) {
      const message = json?.message ?? json?.error ?? `Request failed with status ${response.status}`;
      throw new ApiError(message, response.status);
    }

    return { data: json };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timeout');
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

export const apiClient = {
  get<T>(path: string): Promise<ApiResponse<T>> {
    return request<T>('GET', path);
  },
  post<T>(path: string, body?: unknown): Promise<ApiResponse<T>> {
    return request<T>('POST', path, body);
  },
  patch<T>(path: string, body?: unknown): Promise<ApiResponse<T>> {
    return request<T>('PATCH', path, body);
  },
  put<T>(path: string, body?: unknown): Promise<ApiResponse<T>> {
    return request<T>('PUT', path, body);
  },
  delete<T>(path: string): Promise<ApiResponse<T>> {
    return request<T>('DELETE', path);
  },
};
