import { randomUUID } from 'expo-crypto';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { secureStorage } from '@/services/storage';

const DEVICE_ID_KEY = 'factfront_device_id';

type AppState = {
  deviceId: string;
  hasCompletedOnboarding: boolean;
  appLaunchCount: number;
  lastActiveAt: string | null;
  hasSeenSwipeAnswerHint: boolean;
  hasSeenSwipeContinueHint: boolean;
  hasSeenShieldGuideline: boolean;

  initializeDevice: () => Promise<{ isReturningUser: boolean }>;
  completeOnboarding: () => void;
  incrementLaunchCount: () => void;
  setLastActiveAt: (date: string) => void;
  markSwipeAnswerHintSeen: () => void;
  markSwipeContinueHintSeen: () => void;
  markShieldGuidelineSeen: () => void;
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      deviceId: '',
      hasCompletedOnboarding: false,
      appLaunchCount: 0,
      lastActiveAt: null,
      hasSeenSwipeAnswerHint: false,
      hasSeenSwipeContinueHint: false,
      hasSeenShieldGuideline: false,

      initializeDevice: async () => {
        // 1. Check Keychain/Keystore (persists across app reinstalls on iOS)
        const keychainId = await secureStorage.get(DEVICE_ID_KEY);

        if (keychainId) {
          if (get().deviceId !== keychainId) {
            set({ deviceId: keychainId });
          }
          // Returning user — deviceId survived reinstall
          return { isReturningUser: true };
        }

        // 2. Migrate existing deviceId from AsyncStorage to Keychain
        const storeId = get().deviceId;
        if (storeId) {
          await secureStorage.set(DEVICE_ID_KEY, storeId);
          // Existing user migrating to Keychain — already completed onboarding
          return { isReturningUser: true };
        }

        // 3. First install — generate new deviceId and save to Keychain
        const newId = randomUUID();
        await secureStorage.set(DEVICE_ID_KEY, newId);
        set({ deviceId: newId });
        return { isReturningUser: false };
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

      markSwipeAnswerHintSeen: () => {
        set({ hasSeenSwipeAnswerHint: true });
      },

      markSwipeContinueHintSeen: () => {
        set({ hasSeenSwipeContinueHint: true });
      },

      markShieldGuidelineSeen: () => {
        set({ hasSeenShieldGuideline: true });
      },
    }),
    {
      name: 'factfront-app-store',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
