import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance } from 'react-native';
import { getLocales } from 'expo-localization';

type ThemePreference = 'light' | 'dark';
type Language = 'ru' | 'en';

const CIS_LOCALES = ['ru', 'be', 'uk', 'kk'];

const getDefaultTheme = (): ThemePreference =>
  Appearance.getColorScheme() === 'dark' ? 'dark' : 'light';

const getDefaultLanguage = (): Language => {
  const locale = getLocales()[0]?.languageCode ?? 'en';
  return CIS_LOCALES.includes(locale) ? 'ru' : 'en';
};

type SettingsState = {
  theme: ThemePreference;
  language: Language;
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  notificationsEnabled: boolean;
  replayWarningDismissed: boolean;

  setTheme: (theme: ThemePreference) => void;
  setLanguage: (language: Language) => void;
  setSoundEnabled: (enabled: boolean) => void;
  setHapticsEnabled: (enabled: boolean) => void;
  setNotificationsEnabled: (enabled: boolean) => void;
  setReplayWarningDismissed: (dismissed: boolean) => void;
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: getDefaultTheme(),
      language: getDefaultLanguage(),
      soundEnabled: true,
      hapticsEnabled: true,
      notificationsEnabled: true,
      replayWarningDismissed: false,

      setTheme: (theme: ThemePreference) => {
        set({ theme });
      },

      setLanguage: (language: Language) => {
        set({ language });
      },

      setSoundEnabled: (enabled: boolean) => {
        set({ soundEnabled: enabled });
      },

      setHapticsEnabled: (enabled: boolean) => {
        set({ hapticsEnabled: enabled });
      },

      setNotificationsEnabled: (enabled: boolean) => {
        set({ notificationsEnabled: enabled });
      },

      setReplayWarningDismissed: (dismissed: boolean) => {
        set({ replayWarningDismissed: dismissed });
      },
    }),
    {
      name: 'factfront-settings-store',
      storage: createJSONStorage(() => AsyncStorage),
      version: 1,
      migrate: (persistedState, version) => {
        const state = persistedState as SettingsState & { theme: string; contentLanguage?: unknown };
        if (version === 0) {
          // Migrate 'system' theme to actual system theme
          if (state.theme === 'system') {
            state.theme = getDefaultTheme();
          }
          // Drop contentLanguage (no longer used)
          delete state.contentLanguage;
        }
        return state as SettingsState;
      },
    },
  ),
);
