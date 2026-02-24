import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeContext } from '@/theme';
import type { FC, ReactNode } from 'react';
import type { ViewStyle } from 'react-native';

type CardVariant = 'default' | 'highlighted' | 'flat' | 'gradient';

type CardProps = {
  children: ReactNode;
  variant?: CardVariant;
  highlightColor?: string;
  gradientColors?: [string, string];
  onPress?: () => void;
  style?: ViewStyle;
  accessibilityLabel?: string;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const Card: FC<CardProps> = ({
  children,
  variant = 'default',
  highlightColor,
  gradientColors,
  onPress,
  style,
  accessibilityLabel,
}) => {
  const { colors, borderRadius, elevation, gradients } = useThemeContext();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  const baseStyle: ViewStyle = {
    borderRadius: borderRadius.xl,
  };

  const variantStyle: ViewStyle =
    variant === 'highlighted'
      ? {
          borderWidth: 1.5,
          borderColor: highlightColor ?? colors.primary,
          backgroundColor: colors.surface,
          ...elevation.md,
        }
      : variant === 'flat'
        ? {
            backgroundColor: colors.surfaceVariant,
          }
        : variant === 'gradient'
          ? {}
          : {
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.border,
              ...elevation.sm,
            };

  if (variant === 'gradient') {
    const gColors = gradientColors ?? gradients.card;
    const inner = (
      <LinearGradient
        colors={gColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.container, baseStyle, elevation.md, style]}
      >
        {children}
      </LinearGradient>
    );

    if (onPress) {
      return (
        <AnimatedPressable
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onPress={onPress}
          accessibilityLabel={accessibilityLabel}
          accessibilityRole="button"
          style={animatedStyle}
        >
          {inner}
        </AnimatedPressable>
      );
    }
    return inner;
  }

  const content = (
    <View style={[styles.container, baseStyle, variantStyle, style]}>
      {children}
    </View>
  );

  if (onPress) {
    return (
      <AnimatedPressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress}
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="button"
        style={animatedStyle}
      >
        {content}
      </AnimatedPressable>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    overflow: 'hidden',
  },
});
