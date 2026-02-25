import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { FireParticles } from './FireParticles';
import { fontFamily } from '@/theme/typography';
import type { FC } from 'react';

type StreakBadgeProps = {
  days: number;
  animated?: boolean;
  size?: 'sm' | 'md';
};

type StreakTier = {
  tier: number;
  color: string;
  rotationAmplitude: number;
  scalePulse: number;
  glowRadius: number;
};

function getStreakTier(streak: number): StreakTier {
  if (streak <= 0) return { tier: 0, color: '#F59E0B', rotationAmplitude: 0, scalePulse: 0, glowRadius: 0 };
  if (streak < 5) return { tier: 1, color: '#F59E0B', rotationAmplitude: 3, scalePulse: 0.02, glowRadius: 4 };
  if (streak < 10) return { tier: 2, color: '#F97316', rotationAmplitude: 4, scalePulse: 0.04, glowRadius: 8 };
  if (streak < 25) return { tier: 3, color: '#EF4444', rotationAmplitude: 5, scalePulse: 0.06, glowRadius: 12 };
  if (streak < 50) return { tier: 4, color: '#DC2626', rotationAmplitude: 7, scalePulse: 0.08, glowRadius: 16 };
  if (streak < 85) return { tier: 5, color: '#7C3AED', rotationAmplitude: 9, scalePulse: 0.10, glowRadius: 20 };
  if (streak < 100) return { tier: 6, color: '#6D28D9', rotationAmplitude: 10, scalePulse: 0.12, glowRadius: 24 };
  return { tier: 7, color: '#6366F1', rotationAmplitude: 12, scalePulse: 0.14, glowRadius: 28 };
}

export const StreakBadge: FC<StreakBadgeProps> = ({
  days,
  animated = true,
  size = 'sm',
}) => {
  const prevDaysRef = useRef(days);
  const { tier, color, rotationAmplitude, scalePulse, glowRadius } = getStreakTier(days);

  const rotation = useSharedValue(0);
  const glowScale = useSharedValue(1);
  const burstScale = useSharedValue(1);
  const badgeOpacity = useSharedValue(days > 0 ? 1 : 0);

  useEffect(() => {
    const prevDays = prevDaysRef.current;
    prevDaysRef.current = days;

    if (days === 0) {
      // Fade out on reset
      badgeOpacity.value = withTiming(0.4, { duration: 300 });
      return;
    }

    badgeOpacity.value = withTiming(1, { duration: 200 });

    if (!animated) return;

    // Rotation animation — amplitude based on tier
    rotation.value = withRepeat(
      withSequence(
        withTiming(-rotationAmplitude, { duration: 100 }),
        withTiming(rotationAmplitude, { duration: 200 }),
        withTiming(0, { duration: 100 }),
      ),
      3,
      false,
    );

    // Glow pulse — scale based on tier
    glowScale.value = withRepeat(
      withSequence(
        withTiming(1 + scalePulse * 3, { duration: 1000 }),
        withTiming(1, { duration: 1000 }),
      ),
      -1,
      true,
    );

    // Burst effect on increment
    if (days > prevDays && prevDays > 0) {
      burstScale.value = withSequence(
        withSpring(1.3, { damping: 8, stiffness: 400 }),
        withSpring(1, { damping: 12, stiffness: 200 }),
      );
    }
  }, [animated, days, rotation, glowScale, burstScale, badgeOpacity, rotationAmplitude, scalePulse]);

  const iconAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const glowAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: glowScale.value }],
    opacity: 0.3,
  }));

  const burstAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: burstScale.value }],
    opacity: badgeOpacity.value,
  }));

  const isMd = size === 'md';
  const iconSize = isMd ? 20 : 16;
  const containerSize = isMd ? 52 : 42;

  return (
    <Animated.View style={[styles.outerWrap, burstAnimatedStyle]}>
      {/* Glow */}
      {days > 0 && (
        <Animated.View
          style={[
            styles.glow,
            {
              backgroundColor: color,
              borderRadius: 9999,
              width: containerSize,
              height: isMd ? 28 : 22,
              shadowColor: color,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.6,
              shadowRadius: glowRadius,
              elevation: glowRadius,
            },
            glowAnimatedStyle,
          ]}
        />
      )}

      {/* Fire particles for tier 4+ */}
      {tier >= 4 && (
        <FireParticles
          count={Math.min(tier, 5)}
          color={color}
          containerSize={containerSize}
        />
      )}

      <View
        style={[
          styles.container,
          {
            backgroundColor: color + '20',
            paddingHorizontal: isMd ? 14 : 10,
            paddingVertical: isMd ? 7 : 4,
          },
        ]}
      >
        {/* Main fire icon */}
        <Animated.View style={iconAnimatedStyle}>
          <MaterialCommunityIcons
            name="fire"
            size={iconSize}
            color={color}
          />
          {/* Second fire overlay for tier 3+ */}
          {tier >= 3 && (
            <MaterialCommunityIcons
              name="fire"
              size={iconSize}
              color={color}
              style={styles.fireOverlay}
            />
          )}
        </Animated.View>

        <Text style={[styles.text, { color }, isMd && styles.textMd]}>
          {days}
        </Text>

        {/* Gold star for tier 7 */}
        {tier >= 7 && (
          <Text style={styles.starOverlay}>⭐</Text>
        )}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  outerWrap: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 9999,
    gap: 4,
  },
  text: {
    fontSize: 14,
    fontFamily: fontFamily.bold,
  },
  textMd: {
    fontSize: 18,
  },
  fireOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    opacity: 0.5,
  },
  starOverlay: {
    fontSize: 10,
    marginLeft: -2,
  },
});
