import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
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
    opacity: interpolate(shimmer.value, [0, 0.5, 1], [0.4, 0.8, 0.4]),
  }));

  const translateStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: interpolate(
          shimmer.value,
          [0, 1],
          [-200, 200],
        ),
      },
    ],
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
    >
      <Animated.View style={[styles.shimmer, translateStyle]}>
        <LinearGradient
          colors={['transparent', 'rgba(255,255,255,0.15)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.shimmerGradient}
        />
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  skeleton: {
    overflow: 'hidden',
  },
  shimmer: {
    ...StyleSheet.absoluteFillObject,
  },
  shimmerGradient: {
    flex: 1,
    width: 200,
  },
});
