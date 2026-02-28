import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { FeatureFlagsMap } from '@/features/feature-flags/types';

type FeatureFlagsState = {
  flags: FeatureFlagsMap;
  lastFetchedAt: number | null;
  isLoading: boolean;
  error: string | null;

  setFlags: (flags: FeatureFlagsMap) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  isEnabled: (key: string, defaultValue?: boolean) => boolean;
  getPayload: <T = Record<string, unknown>>(key: string) => T | null;
};

export const useFeatureFlagsStore = create<FeatureFlagsState>()(
  persist(
    (set, get) => ({
      flags: {},
      lastFetchedAt: null,
      isLoading: false,
      error: null,

      setFlags: (flags) =>
        set({ flags, lastFetchedAt: Date.now(), error: null }),

      setLoading: (isLoading) => set({ isLoading }),

      setError: (error) => set({ error }),

      isEnabled: (key: string, defaultValue = false): boolean => {
        const flag = get().flags[key];
        return flag !== undefined ? flag.isEnabled : defaultValue;
      },

      getPayload: <T = Record<string, unknown>>(key: string): T | null => {
        const flag = get().flags[key];
        return flag?.payload !== undefined && flag.payload !== null
          ? (flag.payload as T)
          : null;
      },
    }),
    {
      name: 'feature-flags-store',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
