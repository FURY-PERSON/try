import { useEffect, useRef, useCallback } from 'react';
import { adManager } from '@/services/ads';
import { analytics } from '@/services/analytics';
import { useAdsStore } from '@/stores/useAdsStore';
import { getAdProvider } from '@/services/adProvider';

export const useInterstitialAd = () => {
  const loadedRef = useRef(false);
  const onClosedCallbackRef = useRef<(() => void) | null>(null);
  const unityAdRef = useRef<any>(null);

  const provider = getAdProvider();
  const sdkReady = useAdsStore((s) => s.sdkReady);

  useEffect(() => {
    if (provider !== 'unity' || !sdkReady) return;

    import('unity-levelplay-mediation').then(({ LevelPlayInterstitialAd }) => {
      try {
        const ad = new LevelPlayInterstitialAd(adManager.getInterstitialUnitId());
        unityAdRef.current = ad;

        ad.setListener({
          onAdLoaded: () => { loadedRef.current = true; },
          onAdLoadFailed: () => { loadedRef.current = false; },
          onAdInfoChanged: () => {},
          onAdDisplayed: () => {},
          onAdDisplayFailed: () => {
            onClosedCallbackRef.current?.();
            onClosedCallbackRef.current = null;
          },
          onAdClicked: () => {},
          onAdClosed: () => {
            loadedRef.current = false;
            ad.loadAd();
            onClosedCallbackRef.current?.();
            onClosedCallbackRef.current = null;
          },
        });

        ad.loadAd();
      } catch {
        // Unity ad creation failed
      }
    }).catch(() => {});
  }, [provider, sdkReady]);

  const showIfReady = useCallback(async (onClosed?: () => void): Promise<boolean> => {
    if (!loadedRef.current || !adManager.isAdsEnabled()) {
      return false;
    }

    try {
      if (onClosed) {
        onClosedCallbackRef.current = onClosed;
      }

      if (unityAdRef.current) {
        unityAdRef.current.showAd();
      } else {
        return false;
      }

      await adManager.onInterstitialShown();
      analytics.logEvent('ad_interstitial_shown');
      return true;
    } catch {
      return false;
    }
  }, []);

  /**
   * Show interstitial for game start context.
   * Checks frequency capping rules. Does NOT navigate -- caller is responsible for navigation.
   * Returns true if ad was shown.
   */
  const showForGameStart = useCallback(async (): Promise<boolean> => {
    if (!adManager.shouldShowInterstitialForFacts()) {
      return false;
    }

    if (!loadedRef.current) {
      return false;
    }

    try {
      if (unityAdRef.current) {
        unityAdRef.current.showAd();
      } else {
        return false;
      }

      await adManager.onInterstitialShown();
      useAdsStore.getState().setShowDisableAdsOnReturn(true);
      analytics.logEvent('ad_interstitial_shown');
      return true;
    } catch {
      return false;
    }
  }, []);

  return { showIfReady, showForGameStart };
};
