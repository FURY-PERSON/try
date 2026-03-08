import React, { useState, useCallback, Component, type ReactNode } from 'react';
import { View, StyleSheet, Platform, type LayoutChangeEvent, Alert } from 'react-native';
import { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useThemeContext } from '@/theme';
import { analytics } from '@/services/analytics';
import { useFeatureFlag } from '@/features/feature-flags/hooks/useFeatureFlag';
import { useAdsStore } from '@/stores/useAdsStore';
import { UnityBanner, type BannerSize } from './UnityBanner';
import type { FC } from 'react';

class AdErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error: Error) { console.error('[AdErrorBoundary]', error.message); }
  render() { return this.state.hasError ? null : this.props.children; }
}

const BANNER_CONTAINER_HEIGHTS: Record<BannerSize, number> = {
  BANNER: 66,
  LARGE: 106,
  MEDIUM_RECTANGLE: 266,
};

type AdBannerProps = {
  placement: string;
  size?: BannerSize | 'adaptive';
};

export const AdBanner: FC<AdBannerProps> = ({ placement, size = 'BANNER' }) => {
  const { colors, borderRadius, elevation } = useThemeContext();
  const loaded = useSharedValue(0);
  const errored = useSharedValue(0);

  const [resolvedSize, setResolvedSize] = useState<BannerSize | null>(
    size === 'adaptive' ? null : size,
  );

  const adsEnabled = useFeatureFlag('ads_enable');
  const adFreeUntil = useAdsStore((s) => s.adFreeUntil);
  const isAdFree = Date.now() < adFreeUntil;
  const provider = useAdsStore((s) => s.detectedProvider);
  const sdkReady = useAdsStore((s) => s.sdkReady);

  const bannerFlagKey = `ad_banner_${placement}`;
  const bannerEnabled = useFeatureFlag(bannerFlagKey);

  const handleAdLoaded = useCallback((adNetwork: string) => {
    loaded.value = 1;
    analytics.logEvent('ad_banner_shown', { placement, provider: provider ?? 'unknown', adNetwork });
  }, [loaded, placement, provider]);

  const handleAdFailed = useCallback(() => {
    errored.value = 1;
  }, [errored]);

  const handleLayout = useCallback((e: LayoutChangeEvent) => {
    if (resolvedSize !== null) return;
    const height = e.nativeEvent.layout.height;
    setResolvedSize(height >= 250 ? 'MEDIUM_RECTANGLE' : 'LARGE');
  }, [resolvedSize]);

  const finalSize = resolvedSize ?? 'LARGE';

  const animatedStyle = useAnimatedStyle(() => ({
    height: withTiming(errored.value ? 0 : BANNER_CONTAINER_HEIGHTS[finalSize], { duration: 300 }),
    opacity: withTiming(loaded.value && !errored.value ? 1 : 0, { duration: 300 }),
  }));

  if (!adsEnabled || isAdFree || !bannerEnabled || provider !== 'unity' || !sdkReady) {
    if (__DEV__) {
      console.log(`[AdBanner:${placement}] hidden — adsEnabled=${adsEnabled} isAdFree=${isAdFree} bannerEnabled=${bannerEnabled} provider=${provider} sdkReady=${sdkReady}`);
    }
    return null;
  }

  const containerStyle = [
    styles.container,
    {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.lg,
      borderColor: colors.border,
    },
    elevation.sm,
    animatedStyle,
  ];

  const banner = resolvedSize !== null ? (
    <AdErrorBoundary>
      <UnityBanner
        placement={placement}
        size={finalSize}
        containerStyle={containerStyle}
        onAdLoaded={handleAdLoaded}
        onAdFailed={handleAdFailed}
      />
    </AdErrorBoundary>
  ) : null;

  // Adaptive: keep flex wrapper to measure, render banner inside after measurement
  if (size === 'adaptive') {
    return (
      <View style={{ flex: 1, justifyContent: 'flex-end' }} onLayout={handleLayout}>
        {banner}
      </View>
    );
  }

  return banner;
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 8,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    ...Platform.select({
      android: { elevation: 2 },
    }),
  },
});
