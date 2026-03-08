import React, { useRef, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';
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
import type { ViewStyle } from 'react-native';

// Fibonacci-based delays in seconds: 1, 2, 5, 13, 34
const RETRY_DELAYS_S = [1, 2, 5, 13, 34];

export type BannerSize = 'BANNER' | 'LARGE' | 'MEDIUM_RECTANGLE';

type UnityBannerProps = {
  placement: string;
  size?: BannerSize;
  containerStyle: ViewStyle[];
  onAdLoaded: (adNetwork: string) => void;
  onAdFailed: () => void;
};

export const UnityBanner: FC<UnityBannerProps> = ({ placement, size = 'BANNER', containerStyle, onAdLoaded, onAdFailed }) => {
  const bannerAdViewRef = useRef<LevelPlayBannerAdViewMethods>(null);
  const retriesRef = useRef(0);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleRetry = useCallback(() => {
    if (retriesRef.current >= RETRY_DELAYS_S.length) {
      analytics.logEvent('ad_banner_failed', { placement, provider: useAdsStore.getState().detectedProvider ?? 'unknown' });
      onAdFailed();
      return;
    }
    const delaySec = RETRY_DELAYS_S[retriesRef.current]!;
    retriesRef.current += 1;
    retryTimerRef.current = setTimeout(() => {
      bannerAdViewRef.current?.loadAd();
    }, delaySec * 1000);
  }, [onAdFailed]);

  const adSize = LevelPlayAdSize[size];
  const listener: LevelPlayBannerAdViewListener = {
    onAdLoaded: (adInfo) => {
      console.log(`[UnityBanner:${placement}] loaded, network=${adInfo?.adNetwork}`);
      retriesRef.current = 0;
      onAdLoaded(adInfo?.adNetwork ?? 'unknown');
    },
    onAdLoadFailed: (error) => {
      console.warn(`[UnityBanner:${placement}] load failed (retry ${retriesRef.current}/${RETRY_DELAYS_S.length}):`, error);
      scheduleRetry();
    },
    onAdDisplayed: () => { console.log(`[UnityBanner:${placement}] displayed`); },
    onAdDisplayFailed: (error) => { console.warn(`[UnityBanner:${placement}] display failed:`, error); onAdFailed(); },
    onAdClicked: () => {},
    onAdExpanded: () => {},
    onAdCollapsed: () => {},
    onAdLeftApplication: () => {},
  };

  return (
    <Animated.View style={containerStyle}>
      <View style={styles.banner}>
        <LevelPlayBannerAdView
          ref={bannerAdViewRef}
          adUnitId={adManager.getBannerUnitId()}
          adSize={adSize}
          placementName={placement}
          listener={listener}
          onLayout={() => { console.log(`[UnityBanner:${placement}] onLayout, loading ad... unitId=${adManager.getBannerUnitId()}`); bannerAdViewRef.current?.loadAd(); }}
          style={{ width: adSize.width, height: adSize.height }}
        />
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  banner: {
    alignItems: 'center',
  },
});
