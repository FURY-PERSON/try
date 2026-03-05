import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import { useTranslation } from 'react-i18next';
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
  const { colors, borderRadius } = useThemeContext();
  const { t } = useTranslation();
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  const adsEnabled = useFeatureFlag('ads_enable', true);
  const isAdFree = useAdsStore((s) => s.isAdFree());
  const provider = useAdsStore((s) => s.detectedProvider);

  const bannerFlagKey = `ad_banner_${placement}`;
  const bannerEnabled = useFeatureFlag(bannerFlagKey, true);

  const animatedStyle = useAnimatedStyle(() => ({
    height: withTiming(error ? 0 : 66, { duration: 300 }),
    opacity: withTiming(loaded && !error ? 1 : 0, { duration: 300 }),
  }));

  if (!adsEnabled || isAdFree || !bannerEnabled) {
    return null;
  }

  const handleAdLoaded = () => {
    setLoaded(true);
    analytics.logEvent('ad_banner_shown', { placement, provider });
  };

  const handleAdFailed = () => {
    setError(true);
  };

  // Yandex banner — placeholder until react-native-yandex-mobile-ads is configured
  if (provider === 'yandex') {
    return (
      <Animated.View
        style={[
          styles.container,
          {
            backgroundColor: colors.adContainer,
            borderRadius: borderRadius.md,
          },
          animatedStyle,
        ]}
      >
        <Text style={[styles.label, { color: colors.textSecondary }]}>{t('common.ad')}</Text>
        <View style={styles.banner}>
          {/*
            TODO: Replace with YandexBanner component when react-native-yandex-mobile-ads is installed:
            <YandexBanner
              adUnitId={adManager.getBannerUnitId()}
              size="BANNER_320x50"
              onAdLoaded={handleAdLoaded}
              onAdFailedToLoad={handleAdFailed}
            />
          */}
          <BannerAd
            unitId={adManager.getBannerUnitId()}
            size={BannerAdSize.BANNER}
            onAdLoaded={handleAdLoaded}
            onAdFailedToLoad={handleAdFailed}
          />
        </View>
      </Animated.View>
    );
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: colors.adContainer,
          borderRadius: borderRadius.md,
        },
        animatedStyle,
      ]}
    >
      <Text style={[styles.label, { color: colors.textSecondary }]}>{t('common.ad')}</Text>
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
    paddingVertical: 4,
    overflow: 'hidden',
  },
  label: {
    fontSize: 9,
    fontFamily: 'Nunito_600SemiBold',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  banner: {
    alignItems: 'center',
  },
});
