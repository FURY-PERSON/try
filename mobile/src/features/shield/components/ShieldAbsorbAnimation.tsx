import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { s } from '@/utils/scale';
import { haptics } from '@/utils/haptics';
import type { FC } from 'react';

const PARTICLE_COLORS = ['#3B82F6', '#60A5FA', '#93C5FD', '#2563EB', '#1D4ED8'];
const PARTICLE_DIRS = [
  { x: -30, y: -40 },
  { x: 30, y: -35 },
  { x: -20, y: -50 },
  { x: 25, y: -45 },
  { x: 0, y: -55 },
  { x: -35, y: -20 },
  { x: 35, y: -25 },
  { x: -15, y: 30 },
  { x: 15, y: 25 },
];

const Particle: FC<{ dx: number; dy: number; color: string; delay: number }> = ({
  dx, dy, color, delay,
}) => {
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const opacity = useSharedValue(0);
  const pScale = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withDelay(delay, withSequence(
      withTiming(1, { duration: 80 }),
      withTiming(0, { duration: 500 }),
    ));
    tx.value = withDelay(delay, withTiming(dx, { duration: 600, easing: Easing.out(Easing.cubic) }));
    ty.value = withDelay(delay, withTiming(dy, { duration: 600, easing: Easing.out(Easing.cubic) }));
    pScale.value = withDelay(delay, withSequence(
      withTiming(1.5, { duration: 200 }),
      withTiming(0, { duration: 400 }),
    ));
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateX: tx.value },
      { translateY: ty.value },
      { scale: pScale.value },
    ],
  }));

  return (
    <Animated.View style={[styles.particle, { backgroundColor: color }, style]} />
  );
};

type ShieldAbsorbAnimationProps = {
  visible: boolean;
  /** Soft animation for correct answers (shield just fades away) */
  gentle?: boolean;
  onComplete?: () => void;
};

export const ShieldAbsorbAnimation: FC<ShieldAbsorbAnimationProps> = ({
  visible,
  gentle,
  onComplete,
}) => {
  const shieldScale = useSharedValue(0);
  const shieldOpacity = useSharedValue(0);
  const shieldRotate = useSharedValue(0);
  const flashOpacity = useSharedValue(0);
  const ring1Scale = useSharedValue(0.5);
  const ring1Opacity = useSharedValue(0);
  const ring2Scale = useSharedValue(0.5);
  const ring2Opacity = useSharedValue(0);

  useEffect(() => {
    if (!visible) return;

    if (gentle) {
      // Gentle: shield floats up and fades — no slam, no flash, no particles
      haptics.light();

      shieldScale.value = withSequence(
        withTiming(1.1, { duration: 220, easing: Easing.out(Easing.cubic) }),
        withDelay(400, withTiming(0.6, { duration: 400, easing: Easing.in(Easing.cubic) })),
      );
      shieldOpacity.value = withSequence(
        withTiming(0.8, { duration: 200 }),
        withDelay(400, withTiming(0, { duration: 400 })),
      );
      shieldRotate.value = 0;
      flashOpacity.value = 0;

      // Single soft ring
      ring1Scale.value = 0.8;
      ring1Opacity.value = 0;
      ring1Scale.value = withTiming(2, { duration: 800, easing: Easing.out(Easing.cubic) });
      ring1Opacity.value = withSequence(
        withTiming(0.3, { duration: 150 }),
        withDelay(200, withTiming(0, { duration: 450 })),
      );
      ring2Opacity.value = 0;
    } else {
      // Intense: slam, wobble, flash, rings, particles
      haptics.heavy();

      shieldScale.value = withSequence(
        withTiming(1.6, { duration: 160, easing: Easing.out(Easing.cubic) }),
        withTiming(1.3, { duration: 180, easing: Easing.out(Easing.cubic) }),
        withDelay(300, withTiming(0, { duration: 300, easing: Easing.in(Easing.cubic) })),
      );
      shieldOpacity.value = withSequence(
        withTiming(1, { duration: 100 }),
        withDelay(500, withTiming(0, { duration: 300 })),
      );
      shieldRotate.value = withSequence(
        withTiming(-8, { duration: 80 }),
        withTiming(8, { duration: 100 }),
        withTiming(-4, { duration: 80 }),
        withTiming(0, { duration: 60 }),
      );

      flashOpacity.value = withSequence(
        withTiming(0.4, { duration: 80 }),
        withTiming(0, { duration: 300 }),
      );

      ring1Scale.value = 0.5;
      ring1Opacity.value = 0;
      ring1Scale.value = withDelay(50, withTiming(3.5, { duration: 600, easing: Easing.out(Easing.cubic) }));
      ring1Opacity.value = withDelay(50, withSequence(
        withTiming(0.7, { duration: 100 }),
        withTiming(0, { duration: 500 }),
      ));

      ring2Scale.value = 0.5;
      ring2Opacity.value = 0;
      ring2Scale.value = withDelay(150, withTiming(4, { duration: 700, easing: Easing.out(Easing.cubic) }));
      ring2Opacity.value = withDelay(150, withSequence(
        withTiming(0.5, { duration: 100 }),
        withTiming(0, { duration: 600 }),
      ));
    }

    const timer = setTimeout(() => {
      onComplete?.();
    }, gentle ? 900 : 1000);

    return () => clearTimeout(timer);
  }, [visible]);

  const shieldStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: shieldScale.value },
      { rotate: `${shieldRotate.value}deg` },
    ],
    opacity: shieldOpacity.value,
  }));

  const flashStyle = useAnimatedStyle(() => ({
    opacity: flashOpacity.value,
  }));

  const ring1Style = useAnimatedStyle(() => ({
    transform: [{ scale: ring1Scale.value }],
    opacity: ring1Opacity.value,
  }));

  const ring2Style = useAnimatedStyle(() => ({
    transform: [{ scale: ring2Scale.value }],
    opacity: ring2Opacity.value,
  }));

  if (!visible) return null;

  return (
    <>
      {/* Screen flash — only for intense mode */}
      {!gentle && (
        <Animated.View style={[StyleSheet.absoluteFill, styles.flash, flashStyle]} pointerEvents="none" />
      )}

      <View style={styles.center} pointerEvents="none">
        {/* Expanding rings */}
        <Animated.View style={[styles.ring, ring1Style]} />
        {!gentle && <Animated.View style={[styles.ring, styles.ring2, ring2Style]} />}

        {/* Particles — only for intense mode */}
        {!gentle && PARTICLE_DIRS.map((dir, i) => (
          <Particle
            key={i}
            dx={dir.x}
            dy={dir.y}
            color={PARTICLE_COLORS[i % PARTICLE_COLORS.length]}
            delay={i * 30}
          />
        ))}

        {/* Shield icon */}
        <Animated.View style={shieldStyle}>
          <MaterialCommunityIcons
            name="shield"
            size={gentle ? s(56) : s(80)}
            color={gentle ? '#60A5FA' : '#3B82F6'}
          />
        </Animated.View>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  center: {
    position: 'absolute',
    alignSelf: 'center',
    top: '35%',
    zIndex: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flash: {
    backgroundColor: '#3B82F6',
    zIndex: 99,
  },
  ring: {
    position: 'absolute',
    width: s(60),
    height: s(60),
    borderRadius: s(30),
    borderWidth: 3,
    borderColor: '#60A5FA',
  },
  ring2: {
    borderColor: '#93C5FD',
    borderWidth: 2,
  },
  particle: {
    position: 'absolute',
    width: s(8),
    height: s(8),
    borderRadius: s(4),
  },
});
