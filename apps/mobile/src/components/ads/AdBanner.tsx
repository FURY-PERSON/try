import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import { useTranslation } from 'react-i18next';
import { useThemeContext } from '@/theme';
import { adManager } from '@/services/ads';
import { analytics } from '@/services/analytics';
import type { FC } from 'react';

type AdBannerProps = {
  placement: string;
};

export const AdBanner: FC<AdBannerProps> = ({ placement }) => {
  const { colors, borderRadius } = useThemeContext();
  const { t } = useTranslation();
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  const animatedStyle = useAnimatedStyle(() => ({
    height: withTiming(error ? 0 : 66, { duration: 300 }),
    opacity: withTiming(loaded && !error ? 1 : 0, { duration: 300 }),
  }));

  const handleAdLoaded = () => {
    setLoaded(true);
    analytics.logEvent('ad_banner_shown', { placement });
  };

  const handleAdFailed = () => {
    setError(true);
  };

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
