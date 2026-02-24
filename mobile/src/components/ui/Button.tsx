import React, { useCallback } from 'react';
import { Text, ActivityIndicator, StyleSheet, Pressable, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeContext } from '@/theme';
import { fontFamily } from '@/theme/typography';
import { haptics } from '@/utils/haptics';
import type { FC } from 'react';
import type { ViewStyle } from 'react-native';

type ButtonVariant = 'primary' | 'secondary' | 'success' | 'danger' | 'blue' | 'orange' | 'ghost';
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

const sizeMap: Record<ButtonSize, { height: number; paddingH: number; fontSize: number }> = {
  sm: { height: 38, paddingH: 18, fontSize: 13 },
  md: { height: 46, paddingH: 22, fontSize: 15 },
  lg: { height: 54, paddingH: 28, fontSize: 16 },
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
  const { colors, borderRadius: br, gradients, elevation } = useThemeContext();
  const scale = useSharedValue(1);

  const isGradient = variant === 'primary' || variant === 'success';

  const getColors = useCallback(() => {
    if (disabled) {
      return { bg: colors.surfaceVariant, text: colors.textTertiary };
    }
    switch (variant) {
      case 'primary':
        return { bg: colors.primary, text: colors.textOnPrimary };
      case 'success':
        return { bg: colors.emerald, text: colors.textOnPrimary };
      case 'secondary':
        return { bg: colors.surfaceVariant, text: colors.textPrimary };
      case 'danger':
        return { bg: colors.red, text: colors.textOnPrimary };
      case 'blue':
        return { bg: colors.blue, text: colors.textOnPrimary };
      case 'orange':
        return { bg: colors.orange, text: colors.textOnPrimary };
      case 'ghost':
        return { bg: 'transparent', text: colors.primary };
      default:
        return { bg: colors.primary, text: colors.textOnPrimary };
    }
  }, [variant, disabled, colors]);

  const getGradientColors = (): [string, string] => {
    if (disabled) return [colors.surfaceVariant, colors.surfaceVariant];
    if (variant === 'success') return gradients.success;
    return gradients.primary;
  };

  const btnColors = getColors();
  const sizeConfig = sizeMap[size];

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.96, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  const handlePress = () => {
    if (disabled || loading) return;
    haptics.light();
    onPress();
  };

  const contentInner = loading ? (
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
  );

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
        fullWidth && styles.fullWidth,
        animatedStyle,
        style,
      ]}
    >
      {isGradient && !disabled ? (
        <LinearGradient
          colors={getGradientColors()}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[
            styles.container,
            {
              borderRadius: br.xl,
              height: sizeConfig.height,
              paddingHorizontal: sizeConfig.paddingH,
            },
            elevation.sm,
          ]}
        >
          {contentInner}
        </LinearGradient>
      ) : (
        <View
          style={[
            styles.container,
            {
              backgroundColor: btnColors.bg,
              borderRadius: br.xl,
              height: sizeConfig.height,
              paddingHorizontal: sizeConfig.paddingH,
            },
            variant === 'secondary' && {
              borderWidth: 1,
              borderColor: colors.border,
            },
            variant === 'ghost' && { borderWidth: 0 },
          ]}
        >
          {contentInner}
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
    fontFamily: fontFamily.semiBold,
    textAlign: 'center',
  },
  iconLeft: {
    marginRight: 8,
  },
  iconRight: {
    marginLeft: 8,
  },
});
