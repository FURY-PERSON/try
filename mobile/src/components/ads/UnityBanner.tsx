import React, { useRef } from 'react';
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

type UnityBannerProps = {
  placement: string;
  containerStyle: ViewStyle[];
  onAdLoaded: () => void;
  onAdFailed: () => void;
};

export const UnityBanner: FC<UnityBannerProps> = ({ placement, containerStyle, onAdLoaded, onAdFailed }) => {
  console.log('[UnityBanner] rendering, placement:', placement, 'adUnitId:', adManager.getBannerUnitId());
  const bannerAdViewRef = useRef<LevelPlayBannerAdViewMethods>(null);

  const adSize = LevelPlayAdSize.BANNER;
  const listener: LevelPlayBannerAdViewListener = {
    onAdLoaded: (adInfo) => { console.log('[UnityBanner] ad loaded', adInfo); onAdLoaded(); },
    onAdLoadFailed: (error) => { console.error('[UnityBanner] ad load failed', error); onAdFailed(); },
    onAdDisplayed: () => {},
    onAdDisplayFailed: (error) => { console.error('[UnityBanner] ad display failed', error); onAdFailed(); },
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
