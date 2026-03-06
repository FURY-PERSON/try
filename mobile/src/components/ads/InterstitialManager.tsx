import { useEffect, useRef, useCallback } from 'react';
import {
  InterstitialAdLoader,
  AdRequestConfiguration,
} from 'yandex-mobile-ads';
import { adManager } from '@/services/ads';
import { analytics } from '@/services/analytics';
import { useAdsStore } from '@/stores/useAdsStore';
import { getAdProvider } from '@/services/adProvider';

export const useInterstitialAd = () => {
  const loadedRef = useRef(false);
  const onClosedCallbackRef = useRef<(() => void) | null>(null);
  const yandexAdRef = useRef<Awaited<ReturnType<typeof InterstitialAdLoader.prototype.loadAd>> | null>(null);
  const yandexLoaderRef = useRef<InterstitialAdLoader | null>(null);
  const unityAdRef = useRef<any>(null);

  const provider = getAdProvider();
  const sdkReady = useAdsStore((s) => s.sdkReady);

  const loadYandexAd = useCallback(async () => {
    try {
      if (!yandexLoaderRef.current) {
        yandexLoaderRef.current = await InterstitialAdLoader.create();
      }
      const config = new AdRequestConfiguration({
        adUnitId: adManager.getInterstitialUnitId(),
      });
      const ad = await yandexLoaderRef.current.loadAd(config);
      yandexAdRef.current = ad;
      loadedRef.current = true;
    } catch {
      loadedRef.current = false;
    }
  }, []);

  useEffect(() => {
    if (provider === 'yandex' && sdkReady) {
      loadYandexAd();
    } else if (provider === 'unity' && sdkReady) {
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
    }
  }, [provider, sdkReady, loadYandexAd]);

  const showIfReady = useCallback(async (onClosed?: () => void): Promise<boolean> => {
    if (!loadedRef.current || !adManager.isAdsEnabled()) {
      return false;
    }

    try {
      if (onClosed) {
        onClosedCallbackRef.current = onClosed;
      }

      if (provider === 'yandex' && yandexAdRef.current) {
        const ad = yandexAdRef.current;
        ad.onAdDismissed = () => {
          loadedRef.current = false;
          yandexAdRef.current = null;
          loadYandexAd();
          onClosedCallbackRef.current?.();
          onClosedCallbackRef.current = null;
        };
        ad.onAdFailedToShow = () => {
          onClosedCallbackRef.current?.();
          onClosedCallbackRef.current = null;
        };
        ad.show();
      } else if (unityAdRef.current) {
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
  }, [provider, loadYandexAd]);

  const showForGameStart = useCallback(async (onClosed?: () => void): Promise<boolean> => {
    if (!adManager.shouldShowInterstitialForFacts()) {
      return false;
    }

    if (!loadedRef.current) {
      return false;
    }

    try {
      if (onClosed) {
        onClosedCallbackRef.current = onClosed;
      }

      if (provider === 'yandex' && yandexAdRef.current) {
        const ad = yandexAdRef.current;
        ad.onAdDismissed = () => {
          loadedRef.current = false;
          yandexAdRef.current = null;
          loadYandexAd();
          onClosedCallbackRef.current?.();
          onClosedCallbackRef.current = null;
        };
        ad.onAdFailedToShow = () => {
          onClosedCallbackRef.current?.();
          onClosedCallbackRef.current = null;
        };
        ad.show();
      } else if (unityAdRef.current) {
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
  }, [provider, loadYandexAd]);

  return { showIfReady, showForGameStart };
};
