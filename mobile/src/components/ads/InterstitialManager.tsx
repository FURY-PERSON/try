import { useCallback } from 'react';
import { adManager } from '@/services/ads';
import { analytics } from '@/services/analytics';
import { useAdsStore } from '@/stores/useAdsStore';

// Singleton interstitial ad — persists across screen mounts
let singletonAd: any = null;
let adLoaded = false;
let lastAdNetwork = 'unknown';
let listenerSet = false;
let onClosedCallback: (() => void) | null = null;

function ensureAdLoaded() {
  const provider = useAdsStore.getState().detectedProvider;
  const sdkReady = useAdsStore.getState().sdkReady;
  if (provider !== 'unity' || !sdkReady || listenerSet) return;

  listenerSet = true;

  import('unity-levelplay-mediation').then(({ LevelPlayInterstitialAd }) => {
    try {
      const ad = new LevelPlayInterstitialAd(adManager.getInterstitialUnitId());
      singletonAd = ad;

      ad.setListener({
        onAdLoaded: (adInfo) => {
          adLoaded = true;
          lastAdNetwork = adInfo?.adNetwork ?? 'unknown';
        },
        onAdLoadFailed: (error) => {
          adLoaded = false;
          analytics.logEvent('ad_interstitial_failed', {
            provider: useAdsStore.getState().detectedProvider ?? 'unknown',
            errorCode: error?.errorCode ?? 0,
          });
        },
        onAdInfoChanged: () => {},
        onAdDisplayed: () => {},
        onAdDisplayFailed: () => {
          onClosedCallback?.();
          onClosedCallback = null;
        },
        onAdClicked: () => {},
        onAdClosed: () => {
          adLoaded = false;
          ad.loadAd();
          onClosedCallback?.();
          onClosedCallback = null;
        },
      });

      ad.loadAd();
    } catch {
      // Unity ad creation failed
    }
  }).catch(() => {});
}

// Initialize singleton when SDK becomes ready
useAdsStore.subscribe((state, prev) => {
  if (state.sdkReady && !prev.sdkReady) {
    ensureAdLoaded();
  }
});

// Also try on import in case SDK is already ready
if (useAdsStore.getState().sdkReady) {
  ensureAdLoaded();
}

/**
 * Wait for the ad to be loaded, with a max timeout.
 */
function waitForAdLoaded(timeoutMs: number): Promise<boolean> {
  if (adLoaded) return Promise.resolve(true);
  return new Promise((resolve) => {
    const start = Date.now();
    const interval = setInterval(() => {
      if (adLoaded) {
        clearInterval(interval);
        resolve(true);
      } else if (Date.now() - start >= timeoutMs) {
        clearInterval(interval);
        resolve(false);
      }
    }, 100);
  });
}

export const useInterstitialAd = () => {
  const showIfReady = useCallback(async (onClosed?: () => void): Promise<boolean> => {
    if (!adLoaded || !adManager.isAdsEnabled()) {
      return false;
    }

    try {
      if (onClosed) {
        onClosedCallback = onClosed;
      }

      if (singletonAd) {
        singletonAd.showAd();
      } else {
        return false;
      }

      await adManager.onInterstitialShown();
      analytics.logEvent('ad_interstitial_shown', { context: 'manual', provider: useAdsStore.getState().detectedProvider ?? 'unknown', adNetwork: lastAdNetwork });
      return true;
    } catch {
      return false;
    }
  }, []);

  const showForGameStart = useCallback(async (): Promise<boolean> => {
    // Wait up to 3 seconds for the ad to load so we know the adNetwork
    const loaded = await waitForAdLoaded(3000);
    if (!loaded) {
      analytics.logEvent('ad_interstitial_failed', { provider: useAdsStore.getState().detectedProvider ?? 'unknown', reason: 'not_loaded' });
      return false;
    }

    // Check threshold using the loaded ad's network
    if (!adManager.shouldShowInterstitialForFacts(lastAdNetwork)) {
      return false;
    }

    try {
      if (singletonAd) {
        singletonAd.showAd();
      } else {
        return false;
      }

      await adManager.onInterstitialShown(lastAdNetwork);
      useAdsStore.getState().setShowDisableAdsOnReturn(true);
      analytics.logEvent('ad_interstitial_shown', { context: 'game_start', provider: useAdsStore.getState().detectedProvider ?? 'unknown', adNetwork: lastAdNetwork });
      return true;
    } catch {
      return false;
    }
  }, []);

  return { showIfReady, showForGameStart };
};
