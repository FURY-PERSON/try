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
  const { colors, borderRadius, duoShadow } = useThemeContext();

  const borderStyle: ViewStyle =
    variant === 'flat'
      ? {
          ...duoShadow.cardFlat,
          borderColor: colors.border,
        }
      : {
          ...duoShadow.card,
          borderColor: variant === 'highlighted' ? (highlightColor ?? colors.primary) : colors.border,
          borderBottomColor:
            variant === 'highlighted' ? (highlightColor ?? colors.primaryDark) : colors.borderDark,
        };

  const content = (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          borderRadius: borderRadius.xl,
        },
        borderStyle,
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
      >
        {content}
      </Pressable>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
});
