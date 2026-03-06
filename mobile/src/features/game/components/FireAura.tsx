import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import type { FC } from 'react';

type FireAuraProps = {
  containerWidth: number;
  containerHeight: number;
};

type FlameProps = {
  delay: number;
  startX: number;
  containerHeight: number;
  size: number;
  color: string;
  duration: number;
  swayAmplitude: number;
};

const Flame: FC<FlameProps> = ({
  delay,
  startX,
  containerHeight,
  size,
  color,
  duration,
  swayAmplitude,
}) => {
  const translateY = useSharedValue(0);
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(1);

  useEffect(() => {
    translateY.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(0, { duration: 0 }),
          withTiming(-containerHeight * 1.2, {
            duration,
            easing: Easing.out(Easing.quad),
          }),
        ),
        -1,
        false,
      ),
    );

    translateX.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(0, { duration: 0 }),
          withTiming(swayAmplitude, { duration: duration * 0.3 }),
          withTiming(-swayAmplitude, { duration: duration * 0.4 }),
          withTiming(0, { duration: duration * 0.3 }),
        ),
        -1,
        false,
      ),
    );

    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(0.9, { duration: duration * 0.15 }),
          withTiming(0.7, { duration: duration * 0.35 }),
          withTiming(0, { duration: duration * 0.5 }),
        ),
        -1,
        false,
      ),
    );

    scale.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1.2, { duration: duration * 0.2 }),
          withTiming(0.3, { duration: duration * 0.8 }),
        ),
        -1,
        false,
      ),
    );
  }, [delay, containerHeight, duration, swayAmplitude, translateY, translateX, opacity, scale]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: startX + translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          width: size,
          height: size * 1.4,
          borderRadius: size / 2,
          backgroundColor: color,
        },
        animStyle,
      ]}
    />
  );
};

const FIRE_COLORS = [
  '#FF4500', // OrangeRed
  '#FF6347', // Tomato
  '#FF8C00', // DarkOrange
  '#FFD700', // Gold
  '#FFA500', // Orange
  '#FF0000', // Red
  '#FFAA00', // Amber
  '#FF5522', // RedOrange
];

const FLAME_CONFIGS = [
  { xRatio: -0.4, size: 5, durationBase: 900, swayBase: 3, colorIdx: 0 },
  { xRatio: 0.35, size: 4, durationBase: 1000, swayBase: 4, colorIdx: 1 },
  { xRatio: -0.15, size: 6, durationBase: 800, swayBase: 2, colorIdx: 2 },
  { xRatio: 0.1, size: 5, durationBase: 950, swayBase: 3, colorIdx: 3 },
  { xRatio: 0.4, size: 4, durationBase: 1100, swayBase: 4, colorIdx: 4 },
  { xRatio: -0.35, size: 3, durationBase: 850, swayBase: 5, colorIdx: 5 },
  { xRatio: 0.25, size: 5, durationBase: 750, swayBase: 3, colorIdx: 6 },
  { xRatio: -0.05, size: 4, durationBase: 1050, swayBase: 2, colorIdx: 7 },
  { xRatio: -0.25, size: 6, durationBase: 880, swayBase: 4, colorIdx: 0 },
  { xRatio: 0.0, size: 5, durationBase: 920, swayBase: 3, colorIdx: 3 },
];

export const FireAura: FC<FireAuraProps> = ({
  containerWidth,
  containerHeight,
}) => {
  return (
    <View style={styles.container} pointerEvents="none">
      {FLAME_CONFIGS.map((cfg, i) => (
        <Flame
          key={i}
          delay={i * 120}
          startX={cfg.xRatio * containerWidth}
          containerHeight={containerHeight}
          size={cfg.size}
          color={FIRE_COLORS[cfg.colorIdx]}
          duration={cfg.durationBase}
          swayAmplitude={cfg.swayBase}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'flex-end',
    overflow: 'visible',
  },
});
