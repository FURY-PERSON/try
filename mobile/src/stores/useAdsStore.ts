import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type AdProvider = 'google' | 'yandex';

type AdsState = {
  adFreeUntil: number;
  totalFactsAnswered: number;
  lastInterstitialFactCount: number;
  firstGameTodayDate: string | null;
  firstGameTodayPlayed: boolean;
  detectedProvider: AdProvider | null;
  showDisableAdsOnReturn: boolean;

  setAdFreeUntil: (until: number) => void;
  addFactsAnswered: (count: number) => void;
  setLastInterstitialFactCount: (count: number) => void;
  markFirstGameToday: () => void;
  isFirstGameToday: () => boolean;
  isAdFree: () => boolean;
  getAdFreeRemainingMs: () => number;
  setDetectedProvider: (provider: AdProvider) => void;
  setShowDisableAdsOnReturn: (show: boolean) => void;
  resetDailyState: () => void;
};

const getToday = () => new Date().toISOString().split('T')[0] ?? '';

export const useAdsStore = create<AdsState>()(
  persist(
    (set, get) => ({
      adFreeUntil: 0,
      totalFactsAnswered: 0,
      lastInterstitialFactCount: 0,
      firstGameTodayDate: null,
      firstGameTodayPlayed: false,
      detectedProvider: null,
      showDisableAdsOnReturn: false,

      setAdFreeUntil: (until) => set({ adFreeUntil: until }),

      addFactsAnswered: (count) =>
        set((s) => ({ totalFactsAnswered: s.totalFactsAnswered + count })),

      setLastInterstitialFactCount: (count) =>
        set({ lastInterstitialFactCount: count }),

      markFirstGameToday: () => {
        const today = getToday();
        set({ firstGameTodayDate: today, firstGameTodayPlayed: true });
      },

      isFirstGameToday: () => {
        const { firstGameTodayDate, firstGameTodayPlayed } = get();
        const today = getToday();
        if (firstGameTodayDate !== today) {
          return true;
        }
        return !firstGameTodayPlayed;
      },

      isAdFree: () => {
        return Date.now() < get().adFreeUntil;
      },

      getAdFreeRemainingMs: () => {
        const remaining = get().adFreeUntil - Date.now();
        return remaining > 0 ? remaining : 0;
      },

      setDetectedProvider: (provider) => set({ detectedProvider: provider }),

      setShowDisableAdsOnReturn: (show) => set({ showDisableAdsOnReturn: show }),

      resetDailyState: () => {
        const today = getToday();
        const { firstGameTodayDate } = get();
        if (firstGameTodayDate !== today) {
          set({ firstGameTodayDate: null, firstGameTodayPlayed: false });
        }
      },
    }),
    {
      name: 'ads-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        adFreeUntil: state.adFreeUntil,
        totalFactsAnswered: state.totalFactsAnswered,
        lastInterstitialFactCount: state.lastInterstitialFactCount,
        firstGameTodayDate: state.firstGameTodayDate,
        firstGameTodayPlayed: state.firstGameTodayPlayed,
        detectedProvider: state.detectedProvider,
      }),
    },
  ),
);
