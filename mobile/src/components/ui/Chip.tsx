import React from 'react';
import { Text, Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeContext } from '@/theme';
import { fontFamily } from '@/theme/typography';
import { haptics } from '@/utils/haptics';
import type { FC, ReactNode } from 'react';

type ChipVariant = 'primary' | 'blue' | 'orange' | 'purple' | 'default';

type ChipProps = {
  label: string;
  variant?: ChipVariant;
  selected?: boolean;
  iconLeft?: ReactNode;
  onPress?: () => void;
  accessibilityLabel?: string;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const Chip: FC<ChipProps> = ({
  label,
  variant = 'default',
  selected = false,
  iconLeft,
  onPress,
  accessibilityLabel,
}) => {
  const { colors, borderRadius, gradients } = useThemeContext();
  const scale = useSharedValue(1);

  const variantGradient: Record<ChipVariant, [string, string]> = {
    primary: gradients.primary,
    blue: [colors.blue, colors.blueDark],
    orange: [colors.orange, colors.orangeDark],
    purple: [colors.purple, colors.purpleDark],
    default: [colors.textSecondary, colors.textTertiary],
  };

  const handlePressIn = () => {
    scale.value = withSpring(0.95, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  const handlePress = () => {
    haptics.selection();
    onPress?.();
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const textContent = (
    <View style={styles.content}>
      {iconLeft && <View style={styles.iconLeft}>{iconLeft}</View>}
      <Text
        style={[
          styles.label,
          { color: selected ? colors.textOnPrimary : colors.textPrimary },
        ]}
      >
        {label}
      </Text>
    </View>
  );

  return (
    <AnimatedPressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={animatedStyle}
    >
      {selected ? (
        <LinearGradient
          colors={variantGradient[variant]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.container, { borderRadius: borderRadius.full }]}
        >
          {textContent}
        </LinearGradient>
      ) : (
        <View
          style={[
            styles.container,
            {
              borderRadius: borderRadius.full,
              borderColor: colors.border,
              borderWidth: 1,
              backgroundColor: colors.surface,
            },
          ]}
        >
          {textContent}
        </View>
      )}
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconLeft: {
    marginRight: 6,
  },
  label: {
    fontSize: 13,
    fontFamily: fontFamily.semiBold,
  },
});
