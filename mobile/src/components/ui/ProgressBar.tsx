import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useThemeContext } from '@/theme';
import type { FC } from 'react';

type ProgressBarVariant = 'primary' | 'blue' | 'orange' | 'gold';

type ProgressBarProps = {
  progress: number;
  variant?: ProgressBarVariant;
  height?: number;
  animated?: boolean;
};

export const ProgressBar: FC<ProgressBarProps> = ({
  progress,
  variant = 'primary',
  height = 10,
  animated = true,
}) => {
  const { colors, borderRadius } = useThemeContext();
  const widthPercent = useSharedValue(0);

  const variantColor: Record<ProgressBarVariant, string> = {
    primary: colors.primary,
    blue: colors.blue,
    orange: colors.orange,
    gold: colors.gold,
  };

  useEffect(() => {
    const clampedProgress = Math.min(1, Math.max(0, progress));
    if (animated) {
      widthPercent.value = withSpring(clampedProgress * 100, {
        damping: 20,
        stiffness: 90,
      });
    } else {
      widthPercent.value = clampedProgress * 100;
    }
  }, [progress, animated, widthPercent]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${widthPercent.value}%`,
  }));

  return (
    <View
      style={[
        styles.track,
        {
          backgroundColor: colors.surfaceVariant,
          borderRadius: borderRadius.full,
          height,
        },
      ]}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(progress * 100) }}
    >
      <Animated.View
        style={[
          styles.fill,
          {
            backgroundColor: variantColor[variant],
            borderRadius: borderRadius.full,
            height,
          },
          fillStyle,
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  track: {
    width: '100%',
    overflow: 'hidden',
  },
  fill: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
});
