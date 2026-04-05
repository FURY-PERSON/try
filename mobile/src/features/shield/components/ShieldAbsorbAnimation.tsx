import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  withSpring,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { s } from '@/utils/scale';
import { haptics } from '@/utils/haptics';
import type { FC } from 'react';

type ShieldAbsorbAnimationProps = {
  visible: boolean;
  onComplete?: () => void;
};

export const ShieldAbsorbAnimation: FC<ShieldAbsorbAnimationProps> = ({
  visible,
  onComplete,
}) => {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const glowScale = useSharedValue(1);
  const glowOpacity = useSharedValue(0);

  useEffect(() => {
    if (!visible) return;

    haptics.medium();

    // Shield icon: scale up, glow, then fade
    scale.value = withSequence(
      withSpring(1.5, { damping: 8, stiffness: 400 }),
      withDelay(400, withTiming(0.8, { duration: 300 })),
      withTiming(0, { duration: 200, easing: Easing.in(Easing.cubic) }),
    );

    opacity.value = withSequence(
      withTiming(1, { duration: 150 }),
      withDelay(500, withTiming(0, { duration: 300 })),
    );

    // Glow ring: expand and fade
    glowScale.value = withSequence(
      withTiming(1, { duration: 100 }),
      withTiming(3, { duration: 600, easing: Easing.out(Easing.cubic) }),
    );

    glowOpacity.value = withSequence(
      withTiming(0.6, { duration: 150 }),
      withDelay(200, withTiming(0, { duration: 500 })),
    );

    const timer = setTimeout(() => {
      onComplete?.();
    }, 1000);

    return () => clearTimeout(timer);
  }, [visible]);

  const shieldStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const glowStyle = useAnimatedStyle(() => ({
    transform: [{ scale: glowScale.value }],
    opacity: glowOpacity.value,
  }));

  if (!visible) return null;

  return (
    <>
      {/* Glow ring */}
      <Animated.View style={[styles.glow, glowStyle]} pointerEvents="none" />
      {/* Shield icon */}
      <Animated.View style={[styles.shield, shieldStyle]} pointerEvents="none">
        <MaterialCommunityIcons name="shield" size={s(64)} color="#3B82F6" />
      </Animated.View>
    </>
  );
};

const styles = StyleSheet.create({
  shield: {
    position: 'absolute',
    alignSelf: 'center',
    top: '35%',
    zIndex: 100,
  },
  glow: {
    position: 'absolute',
    alignSelf: 'center',
    top: '35%',
    width: s(64),
    height: s(64),
    borderRadius: s(32),
    backgroundColor: '#3B82F630',
    zIndex: 99,
  },
});
