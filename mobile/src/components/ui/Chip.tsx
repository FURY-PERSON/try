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
    default: colors.border,
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
      style={[
        styles.container,
        {
          borderRadius: borderRadius.full,
          borderColor: selected ? activeColor : colors.border,
          backgroundColor: selected ? activeColor : 'transparent',
        },
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
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 2,
  },
  label: {
    fontSize: 13,
    fontFamily: 'Nunito_600SemiBold',
  },
});
