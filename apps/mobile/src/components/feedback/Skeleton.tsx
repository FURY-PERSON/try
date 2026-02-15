import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { useThemeContext } from '@/theme';
import type { FC } from 'react';
import type { ViewStyle } from 'react-native';

type SkeletonShape = 'rectangle' | 'circle' | 'card';

type SkeletonProps = {
  width: number | string;
  height: number;
  shape?: SkeletonShape;
  style?: ViewStyle;
};

export const Skeleton: FC<SkeletonProps> = ({
  width,
  height,
  shape = 'rectangle',
  style,
}) => {
  const { colors, borderRadius } = useThemeContext();
  const shimmer = useSharedValue(0);

  useEffect(() => {
    shimmer.value = withRepeat(withTiming(1, { duration: 1500 }), -1, false);
  }, [shimmer]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(shimmer.value, [0, 0.5, 1], [0.3, 0.7, 0.3]),
  }));

  const shapeStyle: ViewStyle = {
    rectangle: { borderRadius: borderRadius.sm },
    circle: { borderRadius: typeof height === 'number' ? height / 2 : borderRadius.full },
    card: { borderRadius: borderRadius.xl },
  }[shape];

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width: width as number,
          height,
          backgroundColor: colors.surfaceVariant,
        },
        shapeStyle,
        animatedStyle,
        style,
      ]}
    />
  );
};

const styles = StyleSheet.create({
  skeleton: {
    overflow: 'hidden',
  },
});
