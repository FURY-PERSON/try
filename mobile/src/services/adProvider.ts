import { useAdsStore, type AdProvider } from '@/stores/useAdsStore';
import { useFeatureFlagsStore } from '@/stores/useFeatureFlagsStore';
import { UNITY_APP_KEY } from '@/constants/ads';
import { LevelPlay, LevelPlayInitRequest } from 'unity-levelplay-mediation';
const MAX_INIT_TIMEOUT_MS = 1000;

export function detectAdProvider(): AdProvider | null {
  const store = useFeatureFlagsStore.getState();
  const unityEnabled = store.isEnabled('unity_ads', false);
  return unityEnabled ? 'unity' : null;
}

/**
 * Initialize the ad provider SDK.
 * Resolves after max 1 second so the app is never blocked.
 * SDK continues initializing in the background; when ready, sdkReady is set in the store
 * and ad components will react to it.
 */
export function initAdProvider(): Promise<void> {
  const provider = detectAdProvider();
  if (!provider) return Promise.resolve();

  useAdsStore.getState().setDetectedProvider(provider);

  return new Promise<void>(async (resolve) => {
    // Never block the app longer than 1 second
    const timeout = setTimeout(() => resolve(), MAX_INIT_TIMEOUT_MS);

    try {
      const initRequest = LevelPlayInitRequest.builder(UNITY_APP_KEY).build();
      LevelPlay.init(initRequest, {
        onInitFailed: () => {
          clearTimeout(timeout);
          resolve();
        },
        onInitSuccess: () => {
          useAdsStore.getState().setSdkReady(true);
          clearTimeout(timeout);
          resolve();
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
