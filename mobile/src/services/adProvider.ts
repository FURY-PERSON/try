import * as Localization from 'expo-localization';
import { MobileAds } from 'yandex-mobile-ads';
import {
  LevelPlay,
  LevelPlayInitRequest,
  type LevelPlayInitListener,
} from 'unity-levelplay-mediation';
import { useAdsStore, type AdProvider } from '@/stores/useAdsStore';
import { useFeatureFlagsStore } from '@/stores/useFeatureFlagsStore';
import { UNITY_APP_KEY } from '@/constants/ads';

const CIS_REGIONS = [
  'RU', 'BY', 'KZ', 'UZ', 'TJ', 'KG', 'AM', 'AZ', 'MD', 'UA', 'GE', 'TM',
];

function detectRegion(): string {
  const locales = Localization.getLocales();
  const region = locales[0]?.regionCode?.toUpperCase() ?? '';
  return region;
}

function isCISRegion(): boolean {
  const region = detectRegion();
  return CIS_REGIONS.includes(region);
}

export function detectAdProvider(): AdProvider | null {
  const store = useFeatureFlagsStore.getState();
  const yandexEnabled = store.isEnabled('yandex_ads', false);
  const unityEnabled = store.isEnabled('unity_ads', false);

  if (isCISRegion()) {
    if (yandexEnabled) return 'yandex';
    if (unityEnabled) return 'unity';
    return null;
  }

  if (unityEnabled) return 'unity';
  if (yandexEnabled) return 'yandex';
  return null;
}

export async function initAdProvider(): Promise<void> {
  const provider = detectAdProvider();
  if (!provider) return;

  useAdsStore.getState().setDetectedProvider(provider);

  if (provider === 'yandex') {
    try {
      await MobileAds.initialize();
      useAdsStore.getState().setSdkReady(true);
    } catch {
      // Yandex SDK init failed
    }
  } else {
    try {
      const initRequest = LevelPlayInitRequest.builder(UNITY_APP_KEY).build();
      const initListener: LevelPlayInitListener = {
        onInitFailed: () => {},
        onInitSuccess: () => {
          useAdsStore.getState().setSdkReady(true);
        },
      };
      LevelPlay.init(initRequest, initListener);
    } catch {
      // LevelPlay init failed
    }
  }
}

export function getAdProvider(): AdProvider | null {
  return useAdsStore.getState().detectedProvider ?? detectAdProvider();
}
