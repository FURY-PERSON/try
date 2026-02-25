import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
} from 'react-native-reanimated';
import type { FC } from 'react';

type FireParticlesProps = {
  count: number;
  color: string;
  containerSize: number;
};

const Particle: FC<{ color: string; delay: number; containerSize: number }> = ({
  color,
  delay,
  containerSize,
}) => {
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(0);
  const translateX = useSharedValue(0);

  useEffect(() => {
    const xOffset = (Math.random() - 0.5) * containerSize * 0.6;

    translateX.value = xOffset;
    translateY.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(0, { duration: 0 }),
          withTiming(-containerSize * 0.8, { duration: 1200 }),
        ),
        -1,
        false,
      ),
    );
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(0.8, { duration: 200 }),
          withTiming(0, { duration: 1000 }),
        ),
        -1,
        false,
      ),
    );
  }, [delay, containerSize, translateY, opacity, translateX]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.particle,
        { backgroundColor: color },
        animStyle,
      ]}
    />
  );
};

export const FireParticles: FC<FireParticlesProps> = ({
  count,
  color,
  containerSize,
}) => {
  const particles = Array.from({ length: count }, (_, i) => i);

  return (
    <View style={styles.container} pointerEvents="none">
      {particles.map((i) => (
        <Particle
          key={i}
          color={color}
          delay={i * 300}
          containerSize={containerSize}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  particle: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
  },
});
