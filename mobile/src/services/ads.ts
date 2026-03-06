import { UNITY_AD_UNIT_IDS } from '@/constants/ads';
import { appStorage } from './storage';
import { analytics } from './analytics';
import { getAdProvider } from './adProvider';
import { useAdsStore } from '@/stores/useAdsStore';
import { useFeatureFlagsStore } from '@/stores/useFeatureFlagsStore';

type AdState = {
  userTotalGames: number;
};

const AD_STATE_KEY = 'factfront-ad-state';

const getDefaultState = (): AdState => ({
  userTotalGames: 0,
});

class AdManager {
  private state: AdState = getDefaultState();
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;

    const saved = await appStorage.get<AdState>(AD_STATE_KEY);
    if (saved) {
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
    return UNITY_AD_UNIT_IDS.banner;
  }

  getInterstitialUnitId(): string {
    return UNITY_AD_UNIT_IDS.interstitial;
  }

  getRewardedUnitId(): string {
    return UNITY_AD_UNIT_IDS.rewarded;
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

    return true;
  }

  shouldShowInterstitialForFacts(): boolean {
    if (!this.canShowInterstitial()) return false;

    const adsStore = useAdsStore.getState();

    // Don't show for first game today
    if (adsStore.isFirstGameToday()) return false;

    const flagStore = useFeatureFlagsStore.getState();
    const payload = flagStore.getPayload<{ factsThreshold?: number }>('ad_interstitial_game');
    const threshold = payload?.factsThreshold ?? 30;

    const factsSinceLastAd = adsStore.totalFactsAnswered - adsStore.lastInterstitialFactCount;
    return factsSinceLastAd >= threshold;
  }

  async onInterstitialShown(): Promise<void> {
    analytics.logEvent('ad_interstitial_shown');

    const flagStore = useFeatureFlagsStore.getState();
    const payload = flagStore.getPayload<{ factsThreshold?: number }>('ad_interstitial_game');
    const threshold = payload?.factsThreshold ?? 30;

    const adsStore = useAdsStore.getState();
    // Advance by threshold instead of resetting to current total,
    // so leftover facts carry over: 20+20 answered, threshold 21 → leftover 19
    adsStore.setLastInterstitialFactCount(adsStore.lastInterstitialFactCount + threshold);

    await this.saveState();
  }

  async onGamePlayed(): Promise<void> {
    this.state.userTotalGames += 1;
    await this.saveState();
  }

  activateAdFree(): void {
    const flagStore = useFeatureFlagsStore.getState();
    const payload = flagStore.getPayload<{ adFreeMinutes?: number }>('ad_rewarded_video');
    const minutes = payload?.adFreeMinutes ?? 30;
    const until = Date.now() + minutes * 60 * 1000;
    useAdsStore.getState().setAdFreeUntil(until);
    analytics.logEvent('ad_free_activated', { minutes });
  }
}

export const adManager = new AdManager();
