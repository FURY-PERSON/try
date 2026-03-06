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
import type { FC } from 'react';
import type { ViewStyle } from 'react-native';

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 5_000;

type UnityBannerProps = {
  placement: string;
  containerStyle: ViewStyle[];
  onAdLoaded: () => void;
  onAdFailed: () => void;
};

export const UnityBanner: FC<UnityBannerProps> = ({ placement, containerStyle, onAdLoaded, onAdFailed }) => {
  const bannerAdViewRef = useRef<LevelPlayBannerAdViewMethods>(null);
  const retriesRef = useRef(0);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleRetry = useCallback(() => {
    if (retriesRef.current >= MAX_RETRIES) {
      onAdFailed();
      return;
    }
    retriesRef.current += 1;
    retryTimerRef.current = setTimeout(() => {
      bannerAdViewRef.current?.loadAd();
    }, RETRY_DELAY_MS);
  }, [onAdFailed]);

  const adSize = LevelPlayAdSize.BANNER;
  const listener: LevelPlayBannerAdViewListener = {
    onAdLoaded: () => {
      retriesRef.current = 0;
      onAdLoaded();
    },
    onAdLoadFailed: () => { scheduleRetry(); },
    onAdDisplayed: () => {},
    onAdDisplayFailed: () => { onAdFailed(); },
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
          onLayout={() => bannerAdViewRef.current?.loadAd()}
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
