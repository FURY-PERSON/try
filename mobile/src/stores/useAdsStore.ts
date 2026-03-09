import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type AdProvider = 'unity';

type AdsState = {
  adFreeUntil: number;
  totalFactsAnswered: number;
  lastInterstitialFactCount: number;
  firstGameTodayDate: string | null;
  firstGameTodayPlayed: boolean;
  detectedProvider: AdProvider | null;
  sdkReady: boolean;
  showDisableAdsOnReturn: boolean;
  /** How many times the "tap icon to disable ads" tooltip has been shown */
  adTooltipShownCount: number;
  /** Whether the pulsing dot badge on AdFreeIcon should be visible */
  adIconBadgeVisible: boolean;

  setAdFreeUntil: (until: number) => void;
  addFactsAnswered: (count: number) => void;
  setLastInterstitialFactCount: (count: number) => void;
  markFirstGameToday: () => void;
  isFirstGameToday: () => boolean;
  isAdFree: () => boolean;
  getAdFreeRemainingMs: () => number;
  setDetectedProvider: (provider: AdProvider) => void;
  setSdkReady: (ready: boolean) => void;
  setShowDisableAdsOnReturn: (show: boolean) => void;
  resetDailyState: () => void;
  /** Show tooltip + badge after user closes DisableAdsModal without watching */
  triggerAdIconOnboarding: () => void;
  /** Hide badge after user taps the ad icon */
  dismissAdIconBadge: () => void;
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
      sdkReady: false,
      showDisableAdsOnReturn: false,
      adTooltipShownCount: 0,
      adIconBadgeVisible: false,

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

      setSdkReady: (ready) => set({ sdkReady: ready }),

      setShowDisableAdsOnReturn: (show) => set({ showDisableAdsOnReturn: show }),

      triggerAdIconOnboarding: () => {
        const { adTooltipShownCount } = get();
        if (adTooltipShownCount < 2) {
          set({
            adTooltipShownCount: adTooltipShownCount + 1,
            adIconBadgeVisible: true,
          });
        }
      },

      dismissAdIconBadge: () => set({ adIconBadgeVisible: false }),

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
        adTooltipShownCount: state.adTooltipShownCount,
        adIconBadgeVisible: state.adIconBadgeVisible,
      }),
    },
  ),
);
