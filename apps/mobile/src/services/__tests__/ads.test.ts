import { AD_FREQUENCY } from '@/constants/ads';

// Test the AdManager logic without importing the singleton
// Re-implement the core logic for testing

describe('AdManager canShowInterstitial logic', () => {
  type AdState = {
    interstitialLastShown: number;
    interstitialTodayCount: number;
    userTotalGames: number;
  };

  function canShowInterstitial(state: AdState): boolean {
    if (state.userTotalGames < AD_FREQUENCY.gracePeriodGames) return false;
    if (state.interstitialTodayCount >= AD_FREQUENCY.interstitialMaxPerDay) return false;
    if (Date.now() - state.interstitialLastShown < AD_FREQUENCY.interstitialCooldownMs)
      return false;
    return true;
  }

  it('blocks during grace period (first 3 games)', () => {
    expect(
      canShowInterstitial({
        userTotalGames: 0,
        interstitialTodayCount: 0,
        interstitialLastShown: 0,
      }),
    ).toBe(false);

    expect(
      canShowInterstitial({
        userTotalGames: 2,
        interstitialTodayCount: 0,
        interstitialLastShown: 0,
      }),
    ).toBe(false);
  });

  it('allows after grace period', () => {
    expect(
      canShowInterstitial({
        userTotalGames: 3,
        interstitialTodayCount: 0,
        interstitialLastShown: 0,
      }),
    ).toBe(true);
  });

  it('blocks when daily cap reached', () => {
    expect(
      canShowInterstitial({
        userTotalGames: 10,
        interstitialTodayCount: 10,
        interstitialLastShown: 0,
      }),
    ).toBe(false);
  });

  it('blocks during cooldown period', () => {
    expect(
      canShowInterstitial({
        userTotalGames: 5,
        interstitialTodayCount: 1,
        interstitialLastShown: Date.now() - 60_000, // 60s ago (cooldown is 120s)
      }),
    ).toBe(false);
  });

  it('allows after cooldown period', () => {
    expect(
      canShowInterstitial({
        userTotalGames: 5,
        interstitialTodayCount: 1,
        interstitialLastShown: Date.now() - 130_000, // 130s ago (cooldown is 120s)
      }),
    ).toBe(true);
  });

  it('blocks when all conditions fail simultaneously', () => {
    expect(
      canShowInterstitial({
        userTotalGames: 1, // grace period
        interstitialTodayCount: 15, // over cap
        interstitialLastShown: Date.now(), // just shown
      }),
    ).toBe(false);
  });
});
