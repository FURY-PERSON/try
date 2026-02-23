import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useThemeContext } from '@/theme';
import type { FC } from 'react';

type DividerProps = {
  marginVertical?: number;
  inset?: boolean;
};

export const Divider: FC<DividerProps> = ({ marginVertical = 0, inset = false }) => {
  const { colors } = useThemeContext();

  return (
    <View
      style={[
        styles.divider,
        {
          backgroundColor: colors.separator,
          marginVertical,
        },
        inset && styles.inset,
      ]}
    />
  );
};

const styles = StyleSheet.create({
  divider: {
    height: StyleSheet.hairlineWidth,
    width: '100%',
  },
  inset: {
    marginLeft: 16,
  },
});
