import { useCallback } from 'react';
import { useRouter } from 'expo-router';
import { useAppStore } from '@/stores/useAppStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useUserStore } from '@/stores/useUserStore';
import { profileApi } from '@/features/profile/api/profileApi';
import { analytics } from '@/services/analytics';
import i18n from '@/i18n';

export const useOnboarding = () => {
  const router = useRouter();
  const completeOnboarding = useAppStore((s) => s.completeOnboarding);
  const setLanguage = useSettingsStore((s) => s.setLanguage);
  const setNickname = useUserStore((s) => s.setNickname);
  const setAvatarEmoji = useUserStore((s) => s.setAvatarEmoji);

  const selectLanguage = useCallback(
    (language: 'ru' | 'en') => {
      setLanguage(language);
      i18n.changeLanguage(language);
      router.push('/(onboarding)/step-4');
    },
    [setLanguage, router],
  );

  const finishWithProfile = useCallback(
    async (nickname: string, avatarEmoji: string) => {
      try {
        const deviceId = useAppStore.getState().deviceId;
        await profileApi.register(deviceId);
        await profileApi.updateProfile({ nickname, avatarEmoji });
      } catch {
        // Registration or profile update failed, continue anyway
      }
      setNickname(nickname);
      setAvatarEmoji(avatarEmoji);
      completeOnboarding();
      analytics.logEvent('onboarding_complete', { hasProfile: true });
      router.replace('/(tabs)/home');
    },
    [completeOnboarding, setNickname, setAvatarEmoji, router],
  );

  const skip = useCallback(async () => {
    try {
      const deviceId = useAppStore.getState().deviceId;
      await profileApi.register(deviceId);
    } catch {
      // Registration failed, continue anyway
    }
    completeOnboarding();
    analytics.logEvent('onboarding_complete', { skipped: true });
    router.replace('/(tabs)/home');
  }, [completeOnboarding, router]);

  return { selectLanguage, finishWithProfile, skip };
};
