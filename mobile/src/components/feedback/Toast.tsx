import React, { useEffect, useCallback } from 'react';
import { Text, Platform, StyleSheet, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useThemeContext } from '@/theme';
import { fontFamily } from '@/theme/typography';
import { haptics } from '@/utils/haptics';
import type { FC } from 'react';

type ToastVariant = 'success' | 'error' | 'info' | 'warning';

type ToastProps = {
  message: string;
  variant?: ToastVariant;
  visible: boolean;
  duration?: number;
  onDismiss: () => void;
};

const iconMap: Record<ToastVariant, keyof typeof Feather.glyphMap> = {
  success: 'check-circle',
  error: 'x-circle',
  info: 'info',
  warning: 'alert-triangle',
};

export const Toast: FC<ToastProps> = ({
  message,
  variant = 'info',
  visible,
  duration = 3000,
  onDismiss,
}) => {
  const { colors, borderRadius, elevation } = useThemeContext();
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(-100);

  const variantColor: Record<ToastVariant, string> = {
    success: colors.emerald,
    error: colors.red,
    info: colors.blue,
    warning: colors.orange,
  };

  const dismiss = useCallback(() => {
    onDismiss();
  }, [onDismiss]);

  useEffect(() => {
    if (visible) {
      if (variant === 'success') haptics.success();
      else if (variant === 'error') haptics.error();

      translateY.value = withSpring(0, { damping: 20, stiffness: 300 });
      translateY.value = withDelay(
        duration,
        withTiming(-100, { duration: 300 }, (finished) => {
          if (finished) {
            runOnJS(dismiss)();
          }
        }),
      );
    } else {
      translateY.value = withTiming(-100, { duration: 200 });
    }
  }, [visible, variant, duration, translateY, dismiss]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const activeColor = variantColor[variant];

  return (
    <Animated.View
      style={[
        styles.container,
        {
          top: insets.top + 8,
          backgroundColor: colors.surface,
          borderRadius: borderRadius.xl,
          ...elevation.lg,
        },
        animatedStyle,
      ]}
    >
      <View style={[styles.indicator, { backgroundColor: activeColor }]} />
      <View style={styles.content}>
        <Feather name={iconMap[variant]} size={20} color={activeColor} />
        <Text style={[styles.message, { color: colors.textPrimary }]}>{message}</Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 9999,
    flexDirection: 'row',
    ...Platform.select({
      ios: { overflow: 'hidden' as const },
      android: {},
    }),
  },
  indicator: {
    width: 4,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  message: {
    fontSize: 14,
    fontFamily: fontFamily.semiBold,
    marginLeft: 12,
    flex: 1,
  },
});
