import { useEffect, useRef, useCallback } from 'react';
import {
  InterstitialAd,
  AdEventType,
} from 'react-native-google-mobile-ads';
import { adManager } from '@/services/ads';
import { analytics } from '@/services/analytics';
import { useFeatureFlagsStore } from '@/stores/useFeatureFlagsStore';

const interstitial = InterstitialAd.createForAdRequest(adManager.getInterstitialUnitId());

export const useInterstitialAd = () => {
  const loadedRef = useRef(false);

  useEffect(() => {
    const unsubscribeLoaded = interstitial.addAdEventListener(AdEventType.LOADED, () => {
      loadedRef.current = true;
    });

    const unsubscribeClosed = interstitial.addAdEventListener(AdEventType.CLOSED, () => {
      loadedRef.current = false;
      interstitial.load();
    });

    interstitial.load();

    return () => {
      unsubscribeLoaded();
      unsubscribeClosed();
    };
  }, []);

  const showIfReady = useCallback(async (): Promise<boolean> => {
    const showAds = useFeatureFlagsStore.getState().isEnabled('show_ads', true);
    if (!showAds || !loadedRef.current || !adManager.canShowInterstitial()) {
      return false;
    }

    try {
      await interstitial.show();
      await adManager.onInterstitialShown();
      analytics.logEvent('ad_interstitial_shown');
      return true;
    } catch {
      return false;
    }
  }, []);

  return { showIfReady };
};
