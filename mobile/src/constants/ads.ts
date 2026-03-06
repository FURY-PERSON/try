import { IS_DEV } from './config';

// --- Unity LevelPlay ---
// App Key from Unity LevelPlay dashboard
export const UNITY_APP_KEY = IS_DEV ? '8545d445' : '257423975';

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

// --- Yandex Ads ---
// Demo block IDs for testing: https://yandex.ru/dev/mobile-ads/doc/intro/about.html
const YANDEX_TEST_IDS = {
  banner: 'R-M-18860036-1',       // <-- Insert your Yandex banner block ID
  interstitial: 'R-M-18860036-2', // <-- Insert your Yandex interstitial block ID
  rewarded: 'R-M-18860036-3',     // <-- Insert your Yandex rewarded block ID
} as const;

const YANDEX_PROD_IDS = {
  banner: 'R-M-18860036-1',       // <-- Insert your Yandex banner block ID
  interstitial: 'R-M-18860036-2', // <-- Insert your Yandex interstitial block ID
  rewarded: 'R-M-18860036-3',     // <-- Insert your Yandex rewarded block ID
} as const;

export const YANDEX_AD_UNIT_IDS = IS_DEV ? YANDEX_TEST_IDS : YANDEX_PROD_IDS;

// --- Legacy export for backward compat ---
export const AD_UNIT_IDS = UNITY_AD_UNIT_IDS;

// --- Frequency settings ---
export const AD_FREQUENCY = {
  interstitialCooldownMs: 120_000,
  interstitialMaxPerDay: 10,
  gracePeriodGames: 3,
  defaultFactsPerInterstitial: 30,
  defaultAdFreeMinutes: 30,
} as const;
