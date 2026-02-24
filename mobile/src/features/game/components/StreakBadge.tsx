import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useThemeContext } from '@/theme';
import { fontFamily } from '@/theme/typography';
import type { FC } from 'react';

type StreakBadgeProps = {
  days: number;
  animated?: boolean;
  size?: 'sm' | 'md';
};

export const StreakBadge: FC<StreakBadgeProps> = ({
  days,
  animated = true,
  size = 'sm',
}) => {
  const { colors } = useThemeContext();
  const rotation = useSharedValue(0);
  const glowScale = useSharedValue(1);

  useEffect(() => {
    if (animated && days > 0) {
      rotation.value = withRepeat(
        withSequence(
          withTiming(-5, { duration: 100 }),
          withTiming(5, { duration: 200 }),
          withTiming(0, { duration: 100 }),
        ),
        3,
        false,
      );
      glowScale.value = withRepeat(
        withSequence(
          withTiming(1.15, { duration: 1000 }),
          withTiming(1, { duration: 1000 }),
        ),
        -1,
        true,
      );
    }
  }, [animated, days, rotation, glowScale]);

  const iconAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const glowAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: glowScale.value }],
    opacity: 0.3,
  }));

  const isMd = size === 'md';

  return (
    <View style={styles.outerWrap}>
      {days > 0 && (
        <Animated.View
          style={[
            styles.glow,
            {
              backgroundColor: colors.streakFire,
              borderRadius: 9999,
              width: isMd ? 52 : 42,
              height: isMd ? 28 : 22,
            },
            glowAnimatedStyle,
          ]}
        />
      )}
      <View
        style={[
          styles.container,
          {
            backgroundColor: colors.streakFire + '20',
            paddingHorizontal: isMd ? 14 : 10,
            paddingVertical: isMd ? 7 : 4,
          },
        ]}
      >
        <Animated.View style={iconAnimatedStyle}>
          <MaterialCommunityIcons
            name="fire"
            size={isMd ? 20 : 16}
            color={colors.streakFire}
          />
        </Animated.View>
        <Text style={[styles.text, { color: colors.streakFire }, isMd && styles.textMd]}>
          {days}
        </Text>
      </View>
    </View>
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
});
