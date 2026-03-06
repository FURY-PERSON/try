import * as Localization from 'expo-localization';
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
  console.log('[AdProvider] detectAdProvider:', provider, 'region:', detectRegion());
  if (!provider) return;

  useAdsStore.getState().setDetectedProvider(provider);

  if (provider === 'yandex') {
    try {
      const { MobileAds } = await import('yandex-mobile-ads');
      // Fire-and-forget: MobileAds.initialize() may never resolve its JS promise,
      // but the native SDK initializes fine. BannerView handles queuing internally.
      MobileAds.initialize().catch(() => {});
      useAdsStore.getState().setSdkReady(true);
      console.log('[AdProvider] Yandex SDK ready');
    } catch (e) {
      console.error('[AdProvider] Yandex SDK init failed:', e);
    }
  } else {
    try {
      const { LevelPlay, LevelPlayInitRequest } = await import('unity-levelplay-mediation');
      const initRequest = LevelPlayInitRequest.builder(UNITY_APP_KEY).build();
      LevelPlay.init(initRequest, {
        onInitFailed: (error) => {
          console.error('[AdProvider] LevelPlay init failed:', error);
        },
        onInitSuccess: () => {
          useAdsStore.getState().setSdkReady(true);
          console.log('[AdProvider] LevelPlay SDK initialized');
        },
      });
    } catch (e) {
      console.error('[AdProvider] LevelPlay import/init failed:', e);
    }
  }
}

export function getAdProvider(): AdProvider | null {
  return useAdsStore.getState().detectedProvider ?? detectAdProvider();
}

// Temporary: call from dev menu or debug button
export async function openTestSuite(): Promise<void> {
  console.log('[AdProvider] Launching test suite...');
  try {
    const mod = await import('unity-levelplay-mediation');
    console.log('[AdProvider] Module loaded, calling launchTestSuite');
    await mod.LevelPlay.launchTestSuite();
    console.log('[AdProvider] Test suite launched');
  } catch (e) {
    console.error('[AdProvider] Test suite error:', e);
  }
}
