import { useState, useEffect, useCallback, useRef } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { API_URL } from '@/constants/config';

type ServerStatus = 'checking' | 'available' | 'unavailable';

const HEALTH_URL = `${API_URL}/health`;
const CHECK_TIMEOUT_MS = 5_000;
const AUTO_RETRY_INTERVAL_MS = 30_000;

async function checkServerHealth(): Promise<boolean> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), CHECK_TIMEOUT_MS);
  try {
    const response = await fetch(HEALTH_URL, {
      method: 'GET',
      signal: controller.signal,
    });
    return response.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

export function useServerStatus() {
  const [status, setStatus] = useState<ServerStatus>('checking');
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const check = useCallback(async () => {
    const net = await NetInfo.fetch();
    if (!net.isConnected) {
      // Нет интернета — не показываем экран ошибки сервера
      setStatus('available');
      return;
    }

    setStatus('checking');
    const healthy = await checkServerHealth();
    setStatus(healthy ? 'available' : 'unavailable');

    if (!healthy) {
      retryTimerRef.current = setTimeout(() => {
        void check();
      }, AUTO_RETRY_INTERVAL_MS);
    }
  }, []);

  const retry = useCallback(() => {
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
    void check();
  }, [check]);

  useEffect(() => {
    void check();
    return () => {
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
      }
    };
  }, [check]);

  return { status, retry };
}
