import { useEffect, useRef, useCallback } from 'react';
import {
  InterstitialAd,
  AdEventType,
} from 'react-native-google-mobile-ads';
import { adManager } from '@/services/ads';
import { analytics } from '@/services/analytics';
import { useAdsStore } from '@/stores/useAdsStore';

const interstitial = InterstitialAd.createForAdRequest(adManager.getInterstitialUnitId());

export const useInterstitialAd = () => {
  const loadedRef = useRef(false);
  const onClosedCallbackRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const unsubscribeLoaded = interstitial.addAdEventListener(AdEventType.LOADED, () => {
      loadedRef.current = true;
    });

    const unsubscribeClosed = interstitial.addAdEventListener(AdEventType.CLOSED, () => {
      loadedRef.current = false;
      interstitial.load();
      onClosedCallbackRef.current?.();
      onClosedCallbackRef.current = null;
    });

    interstitial.load();

    return () => {
      unsubscribeLoaded();
      unsubscribeClosed();
    };
  }, []);

  const showIfReady = useCallback(async (onClosed?: () => void): Promise<boolean> => {
    if (!loadedRef.current || !adManager.isAdsEnabled()) {
      return false;
    }

    try {
      if (onClosed) {
        onClosedCallbackRef.current = onClosed;
      }
      await interstitial.show();
      await adManager.onInterstitialShown();
      analytics.logEvent('ad_interstitial_shown');
      return true;
    } catch {
      return false;
    }
  }, []);

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
      await interstitial.show();
      await adManager.onInterstitialShown();
      useAdsStore.getState().setShowDisableAdsOnReturn(true);
      analytics.logEvent('ad_interstitial_game_start');
      return true;
    } catch {
      return false;
    }
  }, []);

  return { showIfReady, showForGameStart };
};
