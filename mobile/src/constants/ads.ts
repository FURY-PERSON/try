import { Platform } from 'react-native';

// --- Unity LevelPlay ---
// App Key from Unity LevelPlay dashboard (per platform)
export const UNITY_APP_KEY = Platform.select({
  ios: '257423975',
  android: '257819945',
}) as string;

export const UNITY_AD_UNIT_IDS = Platform.select({
  ios: {
    banner: 'iq297okfs9s042o8',
    interstitial: 'gdrgnjvgm8lz9qwn',
    rewarded: 'trtyxfqi2bgtjz8q',
  },
  android: {
    banner: 'tk0iaczylahwrgm1',
    interstitial: '7r741iobz72v7m3j',
    rewarded: 'pjt029zip3pt426f',
  },
})!;

// --- Frequency settings ---
export const AD_FREQUENCY = {
  gracePeriodGames: 3,
} as const;
