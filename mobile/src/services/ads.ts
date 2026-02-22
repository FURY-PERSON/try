import { AD_UNIT_IDS, AD_FREQUENCY } from '@/constants/ads';
import { appStorage } from './storage';
import { analytics } from './analytics';

type AdState = {
  interstitialLastShown: number;
  interstitialTodayCount: number;
  interstitialCountDate: string;
  userTotalGames: number;
};

const AD_STATE_KEY = 'factorfake-ad-state';

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

  getBannerUnitId(): string {
    return AD_UNIT_IDS.banner;
  }

  getInterstitialUnitId(): string {
    return AD_UNIT_IDS.interstitial;
  }

  getRewardedUnitId(): string {
    return AD_UNIT_IDS.rewarded;
  }

  canShowInterstitial(): boolean {
    if (this.state.userTotalGames < AD_FREQUENCY.gracePeriodGames) return false;
    if (this.state.interstitialTodayCount >= AD_FREQUENCY.interstitialMaxPerDay) return false;
    if (Date.now() - this.state.interstitialLastShown < AD_FREQUENCY.interstitialCooldownMs)
      return false;
    return true;
  }

  async onInterstitialShown(): Promise<void> {
    this.state.interstitialLastShown = Date.now();
    this.state.interstitialTodayCount += 1;
    analytics.logEvent('ad_interstitial_shown');
    await this.saveState();
  }

  async onGamePlayed(): Promise<void> {
    this.state.userTotalGames += 1;
    await this.saveState();
  }
}

export const adManager = new AdManager();
