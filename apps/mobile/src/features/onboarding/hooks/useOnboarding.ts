import { useCallback } from 'react';
import { useRouter } from 'expo-router';
import { useAppStore } from '@/stores/useAppStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { analytics } from '@/services/analytics';

export const useOnboarding = () => {
  const router = useRouter();
  const completeOnboarding = useAppStore((s) => s.completeOnboarding);
  const setLanguage = useSettingsStore((s) => s.setLanguage);

  const finish = useCallback(
    (language: 'ru' | 'en') => {
      setLanguage(language);
      completeOnboarding();
      analytics.logEvent('onboarding_complete', { language });
      router.replace('/(tabs)/home');
    },
    [completeOnboarding, setLanguage, router],
  );

  const skip = useCallback(() => {
    completeOnboarding();
    analytics.logEvent('onboarding_complete', { skipped: true });
    router.replace('/(tabs)/home');
  }, [completeOnboarding, router]);

  return { finish, skip };
};
