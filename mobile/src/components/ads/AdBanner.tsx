import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Dimensions, Platform } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import { BannerView, BannerAdSize as YandexBannerAdSize, AdRequest as YandexAdRequest } from 'yandex-mobile-ads';
import { useThemeContext } from '@/theme';
import { adManager } from '@/services/ads';
import { analytics } from '@/services/analytics';
import { useFeatureFlag } from '@/features/feature-flags/hooks/useFeatureFlag';
import { useAdsStore } from '@/stores/useAdsStore';
import type { FC } from 'react';

type AdBannerProps = {
  placement: string;
};

export const AdBanner: FC<AdBannerProps> = ({ placement }) => {
  const { colors, borderRadius, elevation } = useThemeContext();
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  const adsEnabled = useFeatureFlag('ads_enable', true);
  const isAdFree = useAdsStore((s) => s.isAdFree());
  const provider = useAdsStore((s) => s.detectedProvider);

  const bannerFlagKey = `ad_banner_${placement}`;
  const bannerEnabled = useFeatureFlag(bannerFlagKey, true);

  const [yandexAdSize, setYandexAdSize] = useState<Awaited<ReturnType<typeof YandexBannerAdSize.stickySize>> | null>(null);

  useEffect(() => {
    if (provider === 'yandex') {
      YandexBannerAdSize.stickySize(Dimensions.get('window').width)
        .then(setYandexAdSize)
        .catch(() => {});
    }
  }, [provider]);

  const animatedStyle = useAnimatedStyle(() => ({
    height: withTiming(error ? 0 : 66, { duration: 300 }),
    opacity: withTiming(loaded && !error ? 1 : 0, { duration: 300 }),
  }));

  if (!adsEnabled || isAdFree || !bannerEnabled) {
    return null;
  }

  const handleAdLoaded = () => {
    setLoaded(true);
    analytics.logEvent('ad_banner_shown', { placement, provider: provider ?? 'unknown' });
  };

  const handleAdFailed = () => {
    setError(true);
  };

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

  if (provider === 'yandex') {
    const adUnitId = adManager.getBannerUnitId();

    return (
      <Animated.View style={containerStyle}>
        <View style={styles.banner}>
          {yandexAdSize && (
            <BannerView
              size={yandexAdSize}
              adUnitId={adUnitId}
              adRequest={new YandexAdRequest({})}
              onAdLoaded={handleAdLoaded}
              onAdFailedToLoad={handleAdFailed}
            />
          )}
        </View>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={containerStyle}>
      <View style={styles.banner}>
        <BannerAd
          unitId={adManager.getBannerUnitId()}
          size={BannerAdSize.BANNER}
          onAdLoaded={handleAdLoaded}
          onAdFailedToLoad={handleAdFailed}
        />
      </View>
    </Animated.View>
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
  banner: {
    alignItems: 'center',
  },
});
