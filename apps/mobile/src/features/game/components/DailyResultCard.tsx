import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useThemeContext } from '@/theme';
import type { FC } from 'react';

type DailyResultCardProps = {
  results: boolean[];
};

export const DailyResultCard: FC<DailyResultCardProps> = ({ results }) => {
  const { colors } = useThemeContext();

  return (
    <View style={styles.container}>
      {results.map((correct, index) => (
        <View
          key={index}
          style={[
            styles.square,
            {
              backgroundColor: correct ? colors.primary : colors.red,
            },
          ]}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
  },
  square: {
    width: 28,
    height: 28,
    borderRadius: 6,
  },
});
