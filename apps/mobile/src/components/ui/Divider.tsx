import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useThemeContext } from '@/theme';
import type { FC } from 'react';

type DividerProps = {
  marginVertical?: number;
};

export const Divider: FC<DividerProps> = ({ marginVertical = 16 }) => {
  const { colors } = useThemeContext();

  return (
    <View
      style={[
        styles.divider,
        {
          backgroundColor: colors.border,
          marginVertical,
        },
      ]}
    />
  );
};

const styles = StyleSheet.create({
  divider: {
    height: 2,
    width: '100%',
  },
});
