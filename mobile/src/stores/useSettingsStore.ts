import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ThemePreference = 'light' | 'dark' | 'system';
type Language = 'ru' | 'en';

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
      theme: 'system',
      language: 'ru',
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
      name: 'factorfake-settings-store',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
