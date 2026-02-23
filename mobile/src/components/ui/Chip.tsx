import React from 'react';
import { Text, Pressable, StyleSheet } from 'react-native';
import { useThemeContext } from '@/theme';
import { haptics } from '@/utils/haptics';
import type { FC } from 'react';

type ChipVariant = 'primary' | 'blue' | 'orange' | 'purple' | 'default';

type ChipProps = {
  label: string;
  variant?: ChipVariant;
  selected?: boolean;
  onPress?: () => void;
  accessibilityLabel?: string;
};

export const Chip: FC<ChipProps> = ({
  label,
  variant = 'default',
  selected = false,
  onPress,
  accessibilityLabel,
}) => {
  const { colors, borderRadius } = useThemeContext();

  const variantColor: Record<ChipVariant, string> = {
    primary: colors.primary,
    blue: colors.blue,
    orange: colors.orange,
    purple: colors.purple,
    default: colors.textSecondary,
  };

  const activeColor = variantColor[variant];

  const handlePress = () => {
    haptics.selection();
    onPress?.();
  };

  return (
    <Pressable
      onPress={handlePress}
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={({ pressed }) => [
        styles.container,
        {
          borderRadius: borderRadius.full,
          borderColor: selected ? activeColor : colors.separator,
          backgroundColor: selected ? activeColor : colors.surfaceVariant,
        },
        pressed && styles.pressed,
      ]}
    >
      <Text
        style={[
          styles.label,
          {
            color: selected ? colors.textOnPrimary : colors.textPrimary,
          },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderWidth: StyleSheet.hairlineWidth,
  },
  label: {
    fontSize: 13,
    fontFamily: 'Nunito_600SemiBold',
  },
  pressed: {
    opacity: 0.7,
  },
});
