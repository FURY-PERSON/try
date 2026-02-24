import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useThemeContext } from '@/theme';
import { fontFamily } from '@/theme/typography';
import type { FC } from 'react';

type BadgeVariant = 'primary' | 'red' | 'orange' | 'blue' | 'emerald';

type BadgeProps = {
  count: number;
  variant?: BadgeVariant;
};

export const Badge: FC<BadgeProps> = ({ count, variant = 'red' }) => {
  const { colors } = useThemeContext();

  const variantColor: Record<BadgeVariant, string> = {
    primary: colors.primary,
    red: colors.red,
    orange: colors.orange,
    blue: colors.blue,
    emerald: colors.emerald,
  };

  if (count <= 0) return null;

  const displayCount = count > 99 ? '99+' : count.toString();

  return (
    <View style={[styles.container, { backgroundColor: variantColor[variant] }]}>
      <Text style={styles.text}>{displayCount}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    position: 'absolute',
    top: -6,
    right: -6,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 11,
    fontFamily: fontFamily.semiBold,
    lineHeight: 16,
  },
});
