import * as Localization from 'expo-localization';
import { MobileAds } from 'yandex-mobile-ads';
import { useAdsStore, type AdProvider } from '@/stores/useAdsStore';
import { useFeatureFlagsStore } from '@/stores/useFeatureFlagsStore';

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

export function detectAdProvider(): AdProvider {
  const store = useFeatureFlagsStore.getState();
  const yandexEnabled = store.isEnabled('yandex_ads', true);
  const googleEnabled = store.isEnabled('google_ads', true);

  if (isCISRegion()) {
    if (yandexEnabled) return 'yandex';
    if (googleEnabled) return 'google';
    return 'yandex';
  }

  if (googleEnabled) return 'google';
  if (yandexEnabled) return 'yandex';
  return 'google';
}

export async function initAdProvider(): Promise<void> {
  const provider = detectAdProvider();
  useAdsStore.getState().setDetectedProvider(provider);

  if (provider === 'yandex') {
    try {
      await MobileAds.initialize();
    } catch {
      // Yandex SDK init failed, silently continue
    }
  }
}

export function getAdProvider(): AdProvider {
  return useAdsStore.getState().detectedProvider ?? detectAdProvider();
}
