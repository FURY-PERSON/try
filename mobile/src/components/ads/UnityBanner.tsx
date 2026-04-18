import React, { useRef, useCallback, useEffect, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import {
  LevelPlayBannerAdView,
  LevelPlayAdSize,
  type LevelPlayBannerAdViewListener,
  type LevelPlayBannerAdViewMethods,
} from 'unity-levelplay-mediation';
import { adManager } from '@/services/ads';
import { analytics } from '@/services/analytics';
import { useAdsStore } from '@/stores/useAdsStore';
import type { FC } from 'react';

// Fibonacci-based delays in seconds: 1, 2, 5, 13, 34
const RETRY_DELAYS_S = [1, 2, 5, 13, 34];

export type BannerSize = 'BANNER' | 'LARGE' | 'MEDIUM_RECTANGLE';

type UnityBannerProps = {
  placement: string;
  size?: BannerSize;
  onAdLoaded: (adNetwork: string) => void;
  onAdFailed: () => void;
};

const AD_SIZES: Record<BannerSize, LevelPlayAdSize> = {
  BANNER: LevelPlayAdSize.BANNER,
  LARGE: LevelPlayAdSize.LARGE,
  MEDIUM_RECTANGLE: LevelPlayAdSize.MEDIUM_RECTANGLE,
};

export const UnityBanner: FC<UnityBannerProps> = ({ placement, size = 'BANNER', onAdLoaded, onAdFailed }) => {
  const bannerAdViewRef = useRef<LevelPlayBannerAdViewMethods>(null);
  const retriesRef = useRef(0);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loadStartedRef = useRef(false);
  const mountedRef = useRef(true);
  const onAdLoadedRef = useRef(onAdLoaded);
  const onAdFailedRef = useRef(onAdFailed);

  useEffect(() => { onAdLoadedRef.current = onAdLoaded; }, [onAdLoaded]);
  useEffect(() => { onAdFailedRef.current = onAdFailed; }, [onAdFailed]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
        retryTimerRef.current = null;
      }
    };
  }, []);

  const safeLoadAd = useCallback(() => {
    if (!mountedRef.current) return;
    try {
      bannerAdViewRef.current?.loadAd();
    } catch (e) {
      console.warn(`[UnityBanner:${placement}] loadAd threw:`, e);
    }
  }, [placement]);

  const scheduleRetry = useCallback(() => {
    if (!mountedRef.current) return;
    if (retriesRef.current >= RETRY_DELAYS_S.length) {
      analytics.logEvent('ad_banner_failed', { placement, provider: useAdsStore.getState().detectedProvider ?? 'unknown' });
      onAdFailedRef.current();
      return;
    }
    const delaySec = RETRY_DELAYS_S[retriesRef.current]!;
    retriesRef.current += 1;
    retryTimerRef.current = setTimeout(() => {
      safeLoadAd();
    }, delaySec * 1000);
  }, [placement, safeLoadAd]);

  const listener = useMemo<LevelPlayBannerAdViewListener>(() => ({
    onAdLoaded: (adInfo) => {
      if (!mountedRef.current) return;
      console.log(`[UnityBanner:${placement}] loaded, network=${adInfo?.adNetwork}`);
      retriesRef.current = 0;
      onAdLoadedRef.current(adInfo?.adNetwork ?? 'unknown');
    },
    onAdLoadFailed: (error) => {
      if (!mountedRef.current) return;
      console.warn(`[UnityBanner:${placement}] load failed (retry ${retriesRef.current}/${RETRY_DELAYS_S.length}):`, error);
      scheduleRetry();
    },
    onAdDisplayed: () => { console.log(`[UnityBanner:${placement}] displayed`); },
    onAdDisplayFailed: (error) => {
      if (!mountedRef.current) return;
      console.warn(`[UnityBanner:${placement}] display failed:`, error);
      onAdFailedRef.current();
    },
    onAdClicked: () => {},
    onAdExpanded: () => {},
    onAdCollapsed: () => {},
    onAdLeftApplication: () => {},
  }), [placement, scheduleRetry]);

  const adSize = AD_SIZES[size];
  const adUnitId = useMemo(() => adManager.getBannerUnitId(), []);
  const nativeStyle = useMemo(() => ({ width: adSize.width, height: adSize.height }), [adSize]);

  const handleLayout = useCallback(() => {
    if (loadStartedRef.current) return;
    loadStartedRef.current = true;
    console.log(`[UnityBanner:${placement}] onLayout, loading ad... unitId=${adUnitId}`);
    safeLoadAd();
  }, [placement, adUnitId, safeLoadAd]);

  if (!adSize || !adUnitId) {
    return null;
  }

  return (
    <View style={styles.banner}>
      <LevelPlayBannerAdView
        ref={bannerAdViewRef}
        adUnitId={adUnitId}
        adSize={adSize}
        placementName={placement}
        listener={listener}
        onLayout={handleLayout}
        style={nativeStyle}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    alignItems: 'center',
  },
});
