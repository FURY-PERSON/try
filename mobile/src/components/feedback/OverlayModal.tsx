import React, { useEffect } from 'react';
import { StyleSheet, Pressable, BackHandler } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import type { FC, ReactNode } from 'react';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const DURATION = 200;

type OverlayModalProps = {
  visible: boolean;
  onClose?: () => void;
  children: ReactNode;
};

export const OverlayModal: FC<OverlayModalProps> = ({
  visible,
  onClose,
  children,
}) => {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.9);
  const pointerEvents = useSharedValue(false);

  useEffect(() => {
    if (visible) {
      pointerEvents.value = true;
      opacity.value = withTiming(1, { duration: DURATION, easing: Easing.out(Easing.cubic) });
      scale.value = withTiming(1, { duration: DURATION, easing: Easing.out(Easing.cubic) });
    } else {
      opacity.value = withTiming(0, { duration: DURATION, easing: Easing.in(Easing.cubic) });
      scale.value = withTiming(0.9, { duration: DURATION, easing: Easing.in(Easing.cubic) });
      // Delay pointer events off so the exit animation plays
      const timeout = setTimeout(() => {
        pointerEvents.value = false;
      }, DURATION);
      return () => clearTimeout(timeout);
    }
  }, [visible, opacity, scale, pointerEvents]);

  // Android hardware back button
  useEffect(() => {
    if (!visible || !onClose) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      onClose();
      return true;
    });
    return () => sub.remove();
  }, [visible, onClose]);

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const contentStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  if (!visible && opacity.value === 0) {
    return null;
  }

  return (
    <Animated.View
      style={[StyleSheet.absoluteFill, styles.container]}
      pointerEvents={visible ? 'auto' : 'none'}
    >
      {/* Backdrop */}
      <AnimatedPressable
        style={[StyleSheet.absoluteFill, styles.backdrop, overlayStyle]}
        onPress={onClose}
      />

      {/* Content */}
      <Animated.View style={[styles.content, contentStyle]}>
        {children}
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  backdrop: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  content: {
    paddingHorizontal: 32,
    width: '100%',
  },
});
