import { UNITY_AD_UNIT_IDS, YANDEX_AD_UNIT_IDS, AD_FREQUENCY } from '@/constants/ads';
import { appStorage } from './storage';
import { analytics } from './analytics';
import { getAdProvider } from './adProvider';
import { useAdsStore } from '@/stores/useAdsStore';
import { useFeatureFlagsStore } from '@/stores/useFeatureFlagsStore';
import type { AdProvider } from '@/stores/useAdsStore';

type AdState = {
  interstitialLastShown: number;
  interstitialTodayCount: number;
  interstitialCountDate: string;
  userTotalGames: number;
};

const AD_STATE_KEY = 'factfront-ad-state';

const getDefaultState = (): AdState => ({
  interstitialLastShown: 0,
  interstitialTodayCount: 0,
  interstitialCountDate: new Date().toISOString().split('T')[0] ?? '',
  userTotalGames: 0,
});

class AdManager {
  private state: AdState = getDefaultState();
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;

    const saved = await appStorage.get<AdState>(AD_STATE_KEY);
    if (saved) {
      const today = new Date().toISOString().split('T')[0] ?? '';
      if (saved.interstitialCountDate !== today) {
        saved.interstitialTodayCount = 0;
        saved.interstitialCountDate = today;
      }
      this.state = saved;
    }

    this.initialized = true;
  }

  private async saveState(): Promise<void> {
    await appStorage.set(AD_STATE_KEY, this.state);
  }

  getProvider(): AdProvider | null {
    return getAdProvider();
  }

  getBannerUnitId(): string {
    return this.getProvider() === 'yandex'
      ? YANDEX_AD_UNIT_IDS.banner
      : UNITY_AD_UNIT_IDS.banner;
  }

  getInterstitialUnitId(): string {
    return this.getProvider() === 'yandex'
      ? YANDEX_AD_UNIT_IDS.interstitial
      : UNITY_AD_UNIT_IDS.interstitial;
  }

  getRewardedUnitId(): string {
    return this.getProvider() === 'yandex'
      ? YANDEX_AD_UNIT_IDS.rewarded
      : UNITY_AD_UNIT_IDS.rewarded;
  }

  isAdsEnabled(): boolean {
    const flagStore = useFeatureFlagsStore.getState();
    if (!flagStore.isEnabled('ads_enable')) return false;
    if (useAdsStore.getState().isAdFree()) return false;
    return true;
  }

  isBannerEnabled(placement: string): boolean {
    if (!this.isAdsEnabled()) return false;
    const flagStore = useFeatureFlagsStore.getState();
    const flagKey = `ad_banner_${placement}`;
    return flagStore.isEnabled(flagKey);
  }

  canShowInterstitial(): boolean {
    if (!this.isAdsEnabled()) return false;

    const flagStore = useFeatureFlagsStore.getState();
    if (!flagStore.isEnabled('ad_interstitial_game')) return false;

    if (this.state.interstitialTodayCount >= AD_FREQUENCY.interstitialMaxPerDay) return false;
    if (Date.now() - this.state.interstitialLastShown < AD_FREQUENCY.interstitialCooldownMs)
      return false;

    return true;
  }

  shouldShowInterstitialForFacts(): boolean {
    if (!this.canShowInterstitial()) return false;

    const adsStore = useAdsStore.getState();

    // Don't show for first game today
    if (adsStore.isFirstGameToday()) return false;

    const flagStore = useFeatureFlagsStore.getState();
    const payload = flagStore.getPayload<{ factsThreshold?: number }>('ad_interstitial_game');
    const threshold = payload?.factsThreshold ?? AD_FREQUENCY.defaultFactsPerInterstitial;

    const factsSinceLastAd = adsStore.totalFactsAnswered - adsStore.lastInterstitialFactCount;
    return factsSinceLastAd >= threshold;
  }

  async onInterstitialShown(): Promise<void> {
    this.state.interstitialLastShown = Date.now();
    this.state.interstitialTodayCount += 1;
    analytics.logEvent('ad_interstitial_shown');

    const adsStore = useAdsStore.getState();
    adsStore.setLastInterstitialFactCount(adsStore.totalFactsAnswered);

    await this.saveState();
  }

  async onGamePlayed(): Promise<void> {
    this.state.userTotalGames += 1;
    await this.saveState();
  }

  activateAdFree(): void {
    const flagStore = useFeatureFlagsStore.getState();
    const payload = flagStore.getPayload<{ adFreeMinutes?: number }>('ad_rewarded_video');
    const minutes = payload?.adFreeMinutes ?? AD_FREQUENCY.defaultAdFreeMinutes;
    const until = Date.now() + minutes * 60 * 1000;
    useAdsStore.getState().setAdFreeUntil(until);
    analytics.logEvent('ad_free_activated', { minutes });
  }
}

export const adManager = new AdManager();
