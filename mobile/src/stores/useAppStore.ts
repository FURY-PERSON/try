import { randomUUID } from 'expo-crypto';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

type AppState = {
  deviceId: string;
  hasCompletedOnboarding: boolean;
  appLaunchCount: number;
  lastActiveAt: string | null;

  initializeDevice: () => void;
  completeOnboarding: () => void;
  incrementLaunchCount: () => void;
  setLastActiveAt: (date: string) => void;
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      deviceId: '',
      hasCompletedOnboarding: false,
      appLaunchCount: 0,
      lastActiveAt: null,

      initializeDevice: () => {
        if (!get().deviceId) {
          set({ deviceId: randomUUID() });
        }
      },

      completeOnboarding: () => {
        set({ hasCompletedOnboarding: true });
      },

      incrementLaunchCount: () => {
        set((state) => ({ appLaunchCount: state.appLaunchCount + 1 }));
      },

      setLastActiveAt: (date: string) => {
        set({ lastActiveAt: date });
      },
    }),
    {
      name: 'factfront-app-store',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
