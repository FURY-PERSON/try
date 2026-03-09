import React, { useEffect, useState, useCallback } from 'react';
import { Pressable, Text, StyleSheet, View, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  withSpring,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useThemeContext } from '@/theme';
import { useAdsStore } from '@/stores/useAdsStore';
import { useFeatureFlag } from '@/features/feature-flags/hooks/useFeatureFlag';
import { fontFamily } from '@/theme/typography';
import type { FC } from 'react';

type AdFreeIconProps = {
  onPress: () => void;
  hideHint?: boolean;
};

export const AdFreeIcon: FC<AdFreeIconProps> = ({ onPress, hideHint }) => {
  const { colors } = useThemeContext();
  const { t } = useTranslation();
  const rewardedEnabled = useFeatureFlag('ad_rewarded_video');
  const adsEnabled = useFeatureFlag('ads_enable');
  const adFreeUntil = useAdsStore((s) => s.adFreeUntil);
  const adIconBadgeVisible = useAdsStore((s) => s.adIconBadgeVisible);
  const dismissAdIconBadge = useAdsStore((s) => s.dismissAdIconBadge);
  const isAdFree = adFreeUntil > Date.now();
  const [remaining, setRemaining] = useState('');
  const [showCheer, setShowCheer] = useState(false);

  const showHint = !isAdFree && !hideHint;
  const pulseScale = useSharedValue(1);
  const hintOpacity = useSharedValue(0);

  // Onboarding tooltip (shown after modal close)
  const onboardingTooltipOpacity = useSharedValue(0);
  const onboardingTooltipTranslateY = useSharedValue(-4);
  // Dot badge pulse
  const dotScale = useSharedValue(1);

  // Cheer animation values
  const cheerScale = useSharedValue(0);
  const cheerOpacity = useSharedValue(0);
  const timerBounce = useSharedValue(1);
  const particle1Y = useSharedValue(0);
  const particle2Y = useSharedValue(0);
  const particle3Y = useSharedValue(0);
  const particle1X = useSharedValue(0);
  const particle2X = useSharedValue(0);
  const particle3X = useSharedValue(0);
  const particleOpacity = useSharedValue(0);

  useEffect(() => {
    if (isAdFree) return;
    pulseScale.value = withDelay(
      1000,
      withRepeat(
        withSequence(
          withTiming(1.2, { duration: 600, easing: Easing.out(Easing.ease) }),
          withTiming(1, { duration: 600, easing: Easing.in(Easing.ease) }),
        ),
        -1,
        false,
      ),
    );
    hintOpacity.value = withDelay(800, withTiming(1, { duration: 300 }));
  }, [isAdFree]);

  useEffect(() => {
    if (hideHint) {
      hintOpacity.value = withTiming(0, { duration: 200 });
    }
  }, [hideHint]);

  // Onboarding: show tooltip + start dot pulse when badge becomes visible
  useEffect(() => {
    if (adIconBadgeVisible && !isAdFree) {
      // Animate tooltip in after 300ms (modal close animation)
      onboardingTooltipTranslateY.value = -4;
      onboardingTooltipOpacity.value = withDelay(300, withTiming(1, { duration: 250 }));
      onboardingTooltipTranslateY.value = withDelay(300, withTiming(0, { duration: 250 }));
      // Auto-hide tooltip after 4 seconds
      onboardingTooltipOpacity.value = withDelay(4300, withTiming(0, { duration: 300 }));

      // Dot badge pulsing
      dotScale.value = withDelay(
        300,
        withRepeat(
          withSequence(
            withTiming(1.3, { duration: 600, easing: Easing.out(Easing.ease) }),
            withTiming(1, { duration: 600, easing: Easing.in(Easing.ease) }),
          ),
          -1,
          false,
        ),
      );
    } else {
      onboardingTooltipOpacity.value = withTiming(0, { duration: 200 });
      dotScale.value = 1;
    }
  }, [adIconBadgeVisible, isAdFree]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const hintStyle = useAnimatedStyle(() => ({
    opacity: hintOpacity.value,
  }));

  const onboardingTooltipStyle = useAnimatedStyle(() => ({
    opacity: onboardingTooltipOpacity.value,
    transform: [{ translateY: onboardingTooltipTranslateY.value }],
  }));

  const dotBadgeStyle = useAnimatedStyle(() => ({
    transform: [{ scale: dotScale.value }],
  }));

  const cheerStyle = useAnimatedStyle(() => ({
    opacity: cheerOpacity.value,
    transform: [{ scale: cheerScale.value }],
  }));

  const timerAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: timerBounce.value }],
  }));

  const makeParticleStyle = (x: Animated.SharedValue<number>, y: Animated.SharedValue<number>) =>
    useAnimatedStyle(() => ({
      opacity: particleOpacity.value,
      transform: [{ translateX: x.value }, { translateY: y.value }],
    }));

  const p1Style = makeParticleStyle(particle1X, particle1Y);
  const p2Style = makeParticleStyle(particle2X, particle2Y);
  const p3Style = makeParticleStyle(particle3X, particle3Y);

  const hideCheer = useCallback(() => setShowCheer(false), []);

  const handleTimerPress = () => {
    setShowCheer(true);

    // Bounce the timer badge
    timerBounce.value = withSequence(
      withSpring(1.15, { damping: 8, stiffness: 400 }),
      withSpring(1, { damping: 12, stiffness: 300 }),
    );

    // Pop in the cheer tooltip
    cheerScale.value = 0;
    cheerOpacity.value = 1;
    cheerScale.value = withSpring(1, { damping: 10, stiffness: 350 });

    // Particles burst out
    particleOpacity.value = 1;
    particle1X.value = 0;
    particle1Y.value = 0;
    particle2X.value = 0;
    particle2Y.value = 0;
    particle3X.value = 0;
    particle3Y.value = 0;

    particle1X.value = withTiming(-18, { duration: 500 });
    particle1Y.value = withTiming(-22, { duration: 500 });
    particle2X.value = withTiming(20, { duration: 500 });
    particle2Y.value = withTiming(-18, { duration: 500 });
    particle3X.value = withTiming(0, { duration: 500 });
    particle3Y.value = withTiming(-28, { duration: 500 });
    particleOpacity.value = withDelay(300, withTiming(0, { duration: 400 }));

    // Fade out cheer after a while
    cheerOpacity.value = withDelay(2500, withTiming(0, { duration: 400 }, () => {
      runOnJS(hideCheer)();
    }));
  };

  useEffect(() => {
    if (!isAdFree) return;

    const update = () => {
      const ms = adFreeUntil - Date.now();
      if (ms <= 0) {
        setRemaining('');
        return;
      }
      const totalSeconds = Math.ceil(ms / 1000);
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      setRemaining(`${minutes}:${seconds.toString().padStart(2, '0')}`);
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [isAdFree, adFreeUntil]);

  const handleAdIconPress = useCallback(() => {
    if (adIconBadgeVisible) {
      dismissAdIconBadge();
    }
    onPress();
  }, [adIconBadgeVisible, dismissAdIconBadge, onPress]);

  if (!rewardedEnabled || !adsEnabled) return null;

  if (isAdFree) {
    const remainingMs = adFreeUntil - Date.now();
    const remainingMin = Math.ceil(remainingMs / 60000);

    return (
      <View style={styles.container}>
        <Pressable onPress={handleTimerPress} hitSlop={8}>
          <Animated.View style={[styles.timerBadge, { backgroundColor: colors.emerald + '15' }, timerAnimStyle]}>
            <MaterialCommunityIcons name="timer-outline" size={16} color={colors.emerald} />
            <Text style={[styles.timerText, { color: colors.emerald }]}>{remaining}</Text>
          </Animated.View>
        </Pressable>

        {/* Particles */}
        <Animated.Text style={[styles.particle, p1Style]}>✨</Animated.Text>
        <Animated.Text style={[styles.particle, p2Style]}>🎉</Animated.Text>
        <Animated.Text style={[styles.particle, p3Style]}>⭐</Animated.Text>

        {/* Cheer tooltip */}
        {showCheer && (
          <Animated.View
            pointerEvents="none"
            style={[styles.cheerBubble, { backgroundColor: colors.emerald + '12', borderColor: colors.emerald + '30' }, cheerStyle]}
          >
            <Text style={[styles.cheerText, { color: colors.emerald }]}>
              {t('ads.adFreeCheer', { minutes: remainingMin })}
            </Text>
          </Animated.View>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Pressable onPress={handleAdIconPress} hitSlop={8}>
        <Animated.View style={[styles.iconBadge, { backgroundColor: colors.gold + '15' }, pulseStyle]}>
          <MaterialCommunityIcons name="television-play" size={18} color={colors.gold} />
          {/* Pulsing dot badge — visible until user taps icon */}
          {adIconBadgeVisible && !isAdFree && (
            <Animated.View style={[styles.dotBadge, { backgroundColor: colors.primary }, dotBadgeStyle]} />
          )}
        </Animated.View>
      </Pressable>
      {showHint && (
        <Animated.View
          pointerEvents="none"
          style={[styles.hint, { backgroundColor: colors.surface, borderColor: colors.border }, hintStyle]}
        >
          <Text style={[styles.hintText, { color: colors.textSecondary }]}>
            {t('ads.disableHint')}
          </Text>
          <View style={[styles.hintArrow, { backgroundColor: colors.surface, borderColor: colors.border }]} />
        </Animated.View>
      )}
      {/* Onboarding tooltip — appears after closing DisableAdsModal without watching */}
      {adIconBadgeVisible && !isAdFree && (
        <Animated.View
          pointerEvents="none"
          style={[styles.onboardingTooltip, onboardingTooltipStyle]}
        >
          <Text style={styles.onboardingTooltipText}>
            {t('ads.tapToDisable')}
          </Text>
          <View style={styles.onboardingTooltipArrow} />
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginRight: 8,
    overflow: 'visible',
    zIndex: 10,
  },
  iconBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  timerText: {
    fontSize: 12,
    fontFamily: fontFamily.semiBold,
  },
  particle: {
    position: 'absolute',
    top: 0,
    left: 8,
    fontSize: 14,
  },
  cheerBubble: {
    position: 'absolute',
    top: 38,
    right: -8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    minWidth: 100,
  },
  cheerText: {
    fontSize: 12,
    fontFamily: fontFamily.semiBold,
    textAlign: 'center',
  },
  hint: {
    position: 'absolute',
    top: 42,
    right: -4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    minWidth: 120,
  },
  hintText: {
    fontSize: 11,
    fontFamily: fontFamily.semiBold,
    textAlign: 'center',
  },
  hintArrow: {
    position: 'absolute',
    top: -5,
    right: 14,
    width: 8,
    height: 8,
    transform: [{ rotate: '45deg' }],
    borderWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: 0,
    borderRightWidth: 0,
  },
  dotBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  onboardingTooltip: {
    position: 'absolute',
    top: 42,
    right: -8,
    backgroundColor: '#1F2937',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 140,
  },
  onboardingTooltipText: {
    fontSize: 12,
    fontFamily: fontFamily.semiBold,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  onboardingTooltipArrow: {
    position: 'absolute',
    top: -4,
    right: 16,
    width: 8,
    height: 8,
    backgroundColor: '#1F2937',
    transform: [{ rotate: '45deg' }],
  },
});
