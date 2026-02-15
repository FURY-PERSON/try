import React, { useCallback } from 'react';
import { Text, ActivityIndicator, StyleSheet, Pressable, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { useThemeContext } from '@/theme';
import { haptics } from '@/utils/haptics';
import type { FC } from 'react';
import type { ViewStyle } from 'react-native';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'blue' | 'orange' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

type ButtonProps = {
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  onPress: () => void;
  style?: ViewStyle;
  accessibilityLabel?: string;
};

const PRESS_DEPTH = 4;

const sizeMap: Record<ButtonSize, { height: number; paddingH: number; fontSize: number }> = {
  sm: { height: 40, paddingH: 16, fontSize: 14 },
  md: { height: 50, paddingH: 20, fontSize: 16 },
  lg: { height: 56, paddingH: 24, fontSize: 17 },
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const Button: FC<ButtonProps> = ({
  label,
  variant = 'primary',
  size = 'md',
  iconLeft,
  iconRight,
  loading = false,
  disabled = false,
  fullWidth = true,
  onPress,
  style,
  accessibilityLabel,
}) => {
  const { colors, borderRadius: br } = useThemeContext();
  const pressed = useSharedValue(0);

  const getColors = useCallback(() => {
    if (disabled) {
      return {
        bg: colors.surfaceVariant,
        shadow: colors.borderDark,
        text: colors.textSecondary,
        border: colors.border,
      };
    }
    switch (variant) {
      case 'primary':
        return { bg: colors.primary, shadow: colors.primaryDark, text: colors.textOnPrimary, border: 'transparent' };
      case 'secondary':
        return { bg: colors.surface, shadow: colors.borderDark, text: colors.textPrimary, border: colors.border };
      case 'danger':
        return { bg: colors.red, shadow: colors.redDark, text: colors.textOnPrimary, border: 'transparent' };
      case 'blue':
        return { bg: colors.blue, shadow: colors.blueDark, text: colors.textOnPrimary, border: 'transparent' };
      case 'orange':
        return { bg: colors.orange, shadow: colors.orangeDark, text: colors.textOnPrimary, border: 'transparent' };
      case 'ghost':
        return { bg: 'transparent', shadow: 'transparent', text: colors.textPrimary, border: 'transparent' };
      default:
        return { bg: colors.primary, shadow: colors.primaryDark, text: colors.textOnPrimary, border: 'transparent' };
    }
  }, [variant, disabled, colors]);

  const btnColors = getColors();
  const sizeConfig = sizeMap[size];

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: pressed.value * PRESS_DEPTH }],
    borderBottomWidth: variant === 'ghost' ? 0 : PRESS_DEPTH - pressed.value * PRESS_DEPTH,
  }));

  const handlePressIn = () => {
    pressed.value = withTiming(1, { duration: 50 });
  };

  const handlePressOut = () => {
    pressed.value = withTiming(0, { duration: 100 });
  };

  const handlePress = () => {
    if (disabled || loading) return;
    haptics.light();
    onPress();
  };

  return (
    <AnimatedPressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      disabled={disabled || loading}
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading }}
      style={[
        styles.container,
        {
          backgroundColor: btnColors.bg,
          borderColor: variant === 'secondary' ? btnColors.border : btnColors.shadow,
          borderBottomColor: btnColors.shadow,
          borderRadius: br.lg,
          height: sizeConfig.height + PRESS_DEPTH,
          paddingHorizontal: sizeConfig.paddingH,
        },
        variant !== 'ghost' && { borderWidth: variant === 'secondary' ? 2 : 0 },
        fullWidth && styles.fullWidth,
        style,
        animatedStyle,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={btnColors.text} />
      ) : (
        <View style={styles.content}>
          {iconLeft && <View style={styles.iconLeft}>{iconLeft}</View>}
          <Text
            style={[
              styles.label,
              {
                color: btnColors.text,
                fontSize: sizeConfig.fontSize,
              },
            ]}
          >
            {label}
          </Text>
          {iconRight && <View style={styles.iconRight}>{iconRight}</View>}
        </View>
      )}
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidth: {
    width: '100%',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontFamily: 'Nunito_700Bold',
    textAlign: 'center',
  },
  iconLeft: {
    marginRight: 8,
  },
  iconRight: {
    marginLeft: 8,
  },
});
