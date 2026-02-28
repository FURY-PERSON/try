import { useCallback } from 'react';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { notifications } from '@/services/notifications';
import { analytics } from '@/services/analytics';
import i18n from '@/i18n';

export const useSettings = () => {
  const theme = useSettingsStore((s) => s.theme);
  const language = useSettingsStore((s) => s.language);
  const contentLanguage = useSettingsStore((s) => s.contentLanguage);
  const soundEnabled = useSettingsStore((s) => s.soundEnabled);
  const hapticsEnabled = useSettingsStore((s) => s.hapticsEnabled);
  const notificationsEnabled = useSettingsStore((s) => s.notificationsEnabled);
  const replayWarningDismissed = useSettingsStore((s) => s.replayWarningDismissed);
  const setTheme = useSettingsStore((s) => s.setTheme);
  const setLanguage = useSettingsStore((s) => s.setLanguage);
  const setContentLanguage = useSettingsStore((s) => s.setContentLanguage);
  const setSoundEnabled = useSettingsStore((s) => s.setSoundEnabled);
  const setHapticsEnabled = useSettingsStore((s) => s.setHapticsEnabled);
  const setNotificationsEnabled = useSettingsStore((s) => s.setNotificationsEnabled);
  const setReplayWarningDismissed = useSettingsStore((s) => s.setReplayWarningDismissed);

  const changeLanguage = useCallback(
    (lang: 'ru' | 'en') => {
      setLanguage(lang);
      i18n.changeLanguage(lang);
      analytics.logEvent('settings_changed', { setting: 'language', value: lang });
    },
    [setLanguage],
  );

  const changeContentLanguage = useCallback(
    (contentLang: 'ru' | 'en' | 'both') => {
      setContentLanguage(contentLang);
      analytics.logEvent('settings_changed', { setting: 'content_language', value: contentLang });
    },
    [setContentLanguage],
  );

  const changeTheme = useCallback(
    (newTheme: 'light' | 'dark' | 'system') => {
      setTheme(newTheme);
      analytics.logEvent('settings_changed', { setting: 'theme', value: newTheme });
    },
    [setTheme],
  );

  const toggleNotifications = useCallback(
    async (enabled: boolean) => {
      if (enabled) {
        const granted = await notifications.requestPermission();
        if (granted) {
          setNotificationsEnabled(true);
          await notifications.scheduleDailyReminder(19, 0);
        }
      } else {
        setNotificationsEnabled(false);
        await notifications.cancelAll();
      }
      analytics.logEvent('settings_changed', {
        setting: 'notifications',
        value: enabled.toString(),
      });
    },
    [setNotificationsEnabled],
  );

  return {
    theme,
    language,
    contentLanguage,
    soundEnabled,
    hapticsEnabled,
    notificationsEnabled,
    replayWarningDismissed,
    setTheme,
    setLanguage,
    setContentLanguage,
    setSoundEnabled,
    setHapticsEnabled,
    setNotificationsEnabled,
    setReplayWarningDismissed,
    changeLanguage,
    changeContentLanguage,
    changeTheme,
    toggleNotifications,
  };
};
