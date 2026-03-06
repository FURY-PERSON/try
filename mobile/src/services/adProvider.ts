import { useAdsStore, type AdProvider } from '@/stores/useAdsStore';
import { useFeatureFlagsStore } from '@/stores/useFeatureFlagsStore';
import { UNITY_APP_KEY } from '@/constants/ads';

export function detectAdProvider(): AdProvider | null {
  const store = useFeatureFlagsStore.getState();
  const unityEnabled = store.isEnabled('unity_ads', false);
  return unityEnabled ? 'unity' : null;
}

/**
 * Initialize the ad provider SDK.
 * Resolves when SDK is ready or after timeout/failure.
 */
export function initAdProvider(): Promise<void> {
  const provider = detectAdProvider();
  if (!provider) return Promise.resolve();

  useAdsStore.getState().setDetectedProvider(provider);

  return new Promise<void>(async (resolve) => {
    // Don't block forever — resolve after 5s regardless
    const timeout = setTimeout(() => resolve(), 5000);

    try {
      const { LevelPlay, LevelPlayInitRequest } = await import('unity-levelplay-mediation');
      const initRequest = LevelPlayInitRequest.builder(UNITY_APP_KEY).build();
      LevelPlay.init(initRequest, {
        onInitFailed: () => {
          clearTimeout(timeout);
          resolve();
        },
        onInitSuccess: () => {
          useAdsStore.getState().setSdkReady(true);
          clearTimeout(timeout);
          // Give ad networks time to fetch waterfall/inventory before UI renders
          setTimeout(() => resolve(), 1000);
        },
      });
    } catch {
      clearTimeout(timeout);
      resolve();
    }
  });
}

export function getAdProvider(): AdProvider | null {
  return useAdsStore.getState().detectedProvider ?? detectAdProvider();
}
