import React, { useCallback, Component, type ReactNode } from 'react';
import { StyleSheet, Platform } from 'react-native';
import { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useThemeContext } from '@/theme';
import { analytics } from '@/services/analytics';
import { useFeatureFlag } from '@/features/feature-flags/hooks/useFeatureFlag';
import { useAdsStore } from '@/stores/useAdsStore';
import { UnityBanner } from './UnityBanner';
import type { FC } from 'react';

class AdErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error: Error) { console.error('[AdErrorBoundary]', error.message); }
  render() { return this.state.hasError ? null : this.props.children; }
}

type AdBannerProps = {
  placement: string;
};

export const AdBanner: FC<AdBannerProps> = ({ placement }) => {
  const { colors, borderRadius, elevation } = useThemeContext();
  const loaded = useSharedValue(0);
  const errored = useSharedValue(0);

  const adsEnabled = useFeatureFlag('ads_enable');
  const adFreeUntil = useAdsStore((s) => s.adFreeUntil);
  const isAdFree = Date.now() < adFreeUntil;
  const provider = useAdsStore((s) => s.detectedProvider);
  const sdkReady = useAdsStore((s) => s.sdkReady);

  const bannerFlagKey = `ad_banner_${placement}`;
  const bannerEnabled = useFeatureFlag(bannerFlagKey);

  const handleAdLoaded = useCallback(() => {
    loaded.value = 1;
    analytics.logEvent('ad_banner_shown', { placement, provider: 'unity' });
  }, [loaded, placement]);

  const handleAdFailed = useCallback(() => {
    errored.value = 1;
  }, [errored]);

  const animatedStyle = useAnimatedStyle(() => ({
    height: withTiming(errored.value ? 0 : 66, { duration: 300 }),
    opacity: withTiming(loaded.value && !errored.value ? 1 : 0, { duration: 300 }),
  }));

  if (!adsEnabled || isAdFree || !bannerEnabled || provider !== 'unity' || !sdkReady) {
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

  return (
    <AdErrorBoundary>
      <UnityBanner
        placement={placement}
        containerStyle={containerStyle}
        onAdLoaded={handleAdLoaded}
        onAdFailed={handleAdFailed}
      />
    </AdErrorBoundary>
  );
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
