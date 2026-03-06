import { IS_DEV } from './config';

// --- Unity LevelPlay ---
// App Key from Unity LevelPlay dashboard
export const UNITY_APP_KEY = IS_DEV ? '257423975' : '257423975';

const UNITY_TEST_IDS = {
  banner: 'iq297okfs9s042o8',
  interstitial: 'gdrgnjvgm8lz9qwn',
  rewarded: 'trtyxfqi2bgtjz8q',
} as const;

const UNITY_PROD_IDS = {
  banner: 'iq297okfs9s042o8',
  interstitial: 'gdrgnjvgm8lz9qwn',
  rewarded: 'trtyxfqi2bgtjz8q',
} as const;

const unityIds = IS_DEV ? UNITY_TEST_IDS : UNITY_PROD_IDS;

export const UNITY_AD_UNIT_IDS = {
  banner: unityIds.banner,
  interstitial: unityIds.interstitial,
  rewarded: unityIds.rewarded,
} as const;

// --- Frequency settings ---
export const AD_FREQUENCY = {
  interstitialCooldownMs: 120_000,
  interstitialMaxPerDay: 10,
  gracePeriodGames: 3,
  defaultFactsPerInterstitial: 30,
  defaultAdFreeMinutes: 30,
} as const;
