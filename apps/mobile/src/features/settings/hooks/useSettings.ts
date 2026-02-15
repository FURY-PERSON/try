import { useCallback } from 'react';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { notifications } from '@/services/notifications';
import { analytics } from '@/services/analytics';
import i18n from '@/i18n';

export const useSettings = () => {
  const store = useSettingsStore();

  const changeLanguage = useCallback(
    (language: 'ru' | 'en') => {
      store.setLanguage(language);
      i18n.changeLanguage(language);
      analytics.logEvent('settings_changed', { setting: 'language', value: language });
    },
    [store],
  );

  const changeTheme = useCallback(
    (theme: 'light' | 'dark' | 'system') => {
      store.setTheme(theme);
      analytics.logEvent('settings_changed', { setting: 'theme', value: theme });
    },
    [store],
  );

  const toggleNotifications = useCallback(
    async (enabled: boolean) => {
      if (enabled) {
        const granted = await notifications.requestPermission();
        if (granted) {
          store.setNotificationsEnabled(true);
          await notifications.scheduleDailyReminder(19, 0);
        }
      } else {
        store.setNotificationsEnabled(false);
        await notifications.cancelAll();
      }
      analytics.logEvent('settings_changed', {
        setting: 'notifications',
        value: enabled.toString(),
      });
    },
    [store],
  );

  return {
    ...store,
    changeLanguage,
    changeTheme,
    toggleNotifications,
  };
};
