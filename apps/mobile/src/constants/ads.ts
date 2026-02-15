import { Platform } from 'react-native';
import { IS_DEV } from './config';

const TEST_IDS = {
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

const PROD_IDS = {
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

const adIds = IS_DEV ? TEST_IDS : PROD_IDS;

export const AD_UNIT_IDS = {
  banner: Platform.OS === 'ios' ? adIds.banner.ios : adIds.banner.android,
  interstitial: Platform.OS === 'ios' ? adIds.interstitial.ios : adIds.interstitial.android,
  rewarded: Platform.OS === 'ios' ? adIds.rewarded.ios : adIds.rewarded.android,
} as const;

export const AD_FREQUENCY = {
  interstitialCooldownMs: 120_000,
  interstitialMaxPerDay: 10,
  gracePeriodGames: 3,
} as const;
