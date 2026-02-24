import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeContext } from '@/theme';
import type { FC } from 'react';

type ProgressBarVariant = 'primary' | 'blue' | 'orange' | 'gold' | 'success';

type ProgressBarProps = {
  progress: number;
  variant?: ProgressBarVariant;
  height?: number;
  animated?: boolean;
};

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

export const ProgressBar: FC<ProgressBarProps> = ({
  progress,
  variant = 'primary',
  height = 10,
  animated = true,
}) => {
  const { colors, borderRadius, gradients } = useThemeContext();
  const widthPercent = useSharedValue(0);

  const variantGradient: Record<ProgressBarVariant, [string, string]> = {
    primary: gradients.primary,
    blue: [colors.blue, colors.blueDark],
    orange: [colors.orange, colors.orangeDark],
    gold: [colors.gold, colors.goldDark],
    success: gradients.success,
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
          borderWidth: 1,
          borderColor: colors.border,
        },
      ]}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(progress * 100) }}
    >
      <AnimatedLinearGradient
        colors={variantGradient[variant]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[
          styles.fill,
          {
            borderRadius: borderRadius.full,
            height: height - 2,
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
