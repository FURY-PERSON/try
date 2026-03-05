import { useEffect, useRef, useCallback } from 'react';
import {
  InterstitialAd,
  AdEventType,
} from 'react-native-google-mobile-ads';
import {
  InterstitialAdLoader,
  AdRequestConfiguration,
} from 'yandex-mobile-ads';
import { adManager } from '@/services/ads';
import { analytics } from '@/services/analytics';
import { useAdsStore } from '@/stores/useAdsStore';
import { getAdProvider } from '@/services/adProvider';

// --- Google interstitial (singleton) ---
const googleInterstitial = InterstitialAd.createForAdRequest(adManager.getInterstitialUnitId());

export const useInterstitialAd = () => {
  const loadedRef = useRef(false);
  const onClosedCallbackRef = useRef<(() => void) | null>(null);
  const yandexAdRef = useRef<Awaited<ReturnType<typeof InterstitialAdLoader.prototype.loadAd>> | null>(null);
  const yandexLoaderRef = useRef<InterstitialAdLoader | null>(null);

  const provider = getAdProvider();

  // --- Load Yandex interstitial ---
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
    if (provider === 'yandex') {
      loadYandexAd();
    } else {
      const unsubscribeLoaded = googleInterstitial.addAdEventListener(AdEventType.LOADED, () => {
        loadedRef.current = true;
      });

      const unsubscribeClosed = googleInterstitial.addAdEventListener(AdEventType.CLOSED, () => {
        loadedRef.current = false;
        googleInterstitial.load();
        onClosedCallbackRef.current?.();
        onClosedCallbackRef.current = null;
      });

      googleInterstitial.load();

      return () => {
        unsubscribeLoaded();
        unsubscribeClosed();
      };
    }
  }, [provider, loadYandexAd]);

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
      } else {
        await googleInterstitial.show();
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
      } else {
        await googleInterstitial.show();
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
