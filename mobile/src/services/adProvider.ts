import { useAdsStore, type AdProvider } from '@/stores/useAdsStore';
import { useFeatureFlagsStore } from '@/stores/useFeatureFlagsStore';
import { UNITY_APP_KEY } from '@/constants/ads';
import { LevelPlay, LevelPlayInitRequest } from 'unity-levelplay-mediation';
const MAX_INIT_TIMEOUT_MS = 1000;

export function detectAdProvider(): AdProvider | null {
  const store = useFeatureFlagsStore.getState();
  const flags = store.flags;
  const flagKeys = Object.keys(flags);
  console.log(`[AdProvider] Feature flags loaded: ${flagKeys.length} flags [${flagKeys.slice(0, 5).join(', ')}${flagKeys.length > 5 ? '...' : ''}]`);
  console.log(`[AdProvider] unity_ads flag:`, flags['unity_ads']);
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
  if (!provider) {
    console.log('[AdProvider] No ad provider detected (unity_ads flag off?)');
    return Promise.resolve();
  }

  console.log('[AdProvider] Detected provider:', provider);
  useAdsStore.getState().setDetectedProvider(provider);

  return new Promise<void>(async (resolve) => {
    // Never block the app longer than 1 second
    const timeout = setTimeout(() => {
      console.log('[AdProvider] Init timed out, SDK continues in background');
      resolve();
    }, MAX_INIT_TIMEOUT_MS);

    try {
      const initRequest = LevelPlayInitRequest.builder(UNITY_APP_KEY).build();
      LevelPlay.init(initRequest, {
        onInitFailed: (error) => {
          console.warn('[AdProvider] SDK init failed:', error);
          clearTimeout(timeout);
          resolve();
        },
        onInitSuccess: () => {
          console.log('[AdProvider] SDK init success, setting sdkReady=true');
          useAdsStore.getState().setSdkReady(true);
          clearTimeout(timeout);
          resolve();
        },
      });
    } catch (e) {
      console.warn('[AdProvider] SDK init threw:', e);
      clearTimeout(timeout);
      resolve();
    }
  });
}

export function getAdProvider(): AdProvider | null {
  return useAdsStore.getState().detectedProvider ?? detectAdProvider();
}
