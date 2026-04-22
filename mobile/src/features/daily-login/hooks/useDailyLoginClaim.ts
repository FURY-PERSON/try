import { useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';
import { dailyLoginApi } from '../api/dailyLoginApi';

/**
 * Called once per session when the authenticated home screen mounts.
 *
 * Проверяет статус ежедневного бонуса (GET, без побочных эффектов).
 * Если награду сегодня ещё не забрали — открывает модалку с preview.
 * Фактическое начисление происходит по кнопке "Забрать" внутри модалки.
 */
export function useDailyLoginClaim(): void {
  const router = useRouter();
  const attempted = useRef(false);

  useEffect(() => {
    if (attempted.current) return;
    attempted.current = true;

    let cancelled = false;
    (async () => {
      try {
        const status = await dailyLoginApi.getStatus();
        if (cancelled) return;
        if (!status.isEnabled) return;
        if (status.claimedToday) return;

        router.push({
          pathname: '/modal/daily-login-bonus',
          params: {
            day: String(status.next.day),
            shieldsToday: String(status.next.shields),
            streakToday: String(status.next.streak),
          },
        });
      } catch (err) {
        if (__DEV__) console.warn('[daily-login] status check failed', err);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
