import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { useThemeContext } from '@/theme';
import type { FC, ReactNode } from 'react';
import type { ViewStyle } from 'react-native';

type CardVariant = 'default' | 'highlighted' | 'flat';

type CardProps = {
  children: ReactNode;
  variant?: CardVariant;
  highlightColor?: string;
  onPress?: () => void;
  style?: ViewStyle;
  accessibilityLabel?: string;
};

export const Card: FC<CardProps> = ({
  children,
  variant = 'default',
  highlightColor,
  onPress,
  style,
  accessibilityLabel,
}) => {
  const { colors, borderRadius, elevation } = useThemeContext();

  const variantStyle: ViewStyle =
    variant === 'highlighted'
      ? {
          borderWidth: 1.5,
          borderColor: highlightColor ?? colors.primary,
        }
      : variant === 'flat'
        ? {
            backgroundColor: colors.surfaceVariant,
          }
        : {
            ...elevation.sm,
          };

  const content = (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          borderRadius: borderRadius.xl,
        },
        variantStyle,
        style,
      ]}
    >
      {children}
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="button"
        style={({ pressed }) => pressed && styles.pressed}
      >
        {content}
      </Pressable>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  pressed: {
    opacity: 0.7,
  },
});
