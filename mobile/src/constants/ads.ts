import { Platform } from 'react-native';
import { IS_DEV } from './config';

// --- Google Ads ---
const GOOGLE_TEST_IDS = {
  banner: {
    ios: 'ca-app-pub-3940256099942544/2934735716',
    android: 'ca-app-pub-3940256099942544/6300978111',
  },
  interstitial: {
    ios: 'ca-app-pub-3940256099942544/4411468910',
    android: 'ca-app-pub-3940256099942544/1033173712',
  },
  rewarded: {
    ios: 'ca-app-pub-3940256099942544/1712485313',
    android: 'ca-app-pub-3940256099942544/5224354917',
  },
} as const;

const GOOGLE_PROD_IDS = {
  banner: {
    ios: 'ca-app-pub-XXXXXXXXXXXXXXXX/BANNER_IOS',
    android: 'ca-app-pub-XXXXXXXXXXXXXXXX/BANNER_ANDROID',
  },
  interstitial: {
    ios: 'ca-app-pub-XXXXXXXXXXXXXXXX/INTERSTITIAL_IOS',
    android: 'ca-app-pub-XXXXXXXXXXXXXXXX/INTERSTITIAL_ANDROID',
  },
  rewarded: {
    ios: 'ca-app-pub-XXXXXXXXXXXXXXXX/REWARDED_IOS',
    android: 'ca-app-pub-XXXXXXXXXXXXXXXX/REWARDED_ANDROID',
  },
} as const;

const googleIds = IS_DEV ? GOOGLE_TEST_IDS : GOOGLE_PROD_IDS;

export const GOOGLE_AD_UNIT_IDS = {
  banner: Platform.OS === 'ios' ? googleIds.banner.ios : googleIds.banner.android,
  interstitial: Platform.OS === 'ios' ? googleIds.interstitial.ios : googleIds.interstitial.android,
  rewarded: Platform.OS === 'ios' ? googleIds.rewarded.ios : googleIds.rewarded.android,
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
export const AD_UNIT_IDS = GOOGLE_AD_UNIT_IDS;

// --- Frequency settings ---
export const AD_FREQUENCY = {
  interstitialCooldownMs: 120_000,
  interstitialMaxPerDay: 10,
  gracePeriodGames: 3,
  defaultFactsPerInterstitial: 30,
  defaultAdFreeMinutes: 30,
} as const;
