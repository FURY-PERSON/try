import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withSpring,
} from 'react-native-reanimated';
import { useThemeContext } from '@/theme';
import type { FC } from 'react';
import { s } from '@/utils/scale';

type DailyResultCardProps = {
  results: boolean[];
};

const ResultSquare: FC<{ correct: boolean; index: number; colors: Record<string, string> }> = React.memo(({
  correct,
  index,
  colors,
}) => {
  const scale = useSharedValue(0);

  useEffect(() => {
    scale.value = withDelay(
      index * 80,
      withSpring(1, { damping: 12, stiffness: 200 }),
    );
  }, [index, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      style={[
        styles.square,
        {
          backgroundColor: correct ? colors.emerald : colors.red,
          borderRadius: 6,
        },
        animatedStyle,
      ]}
    />
  );
});

export const DailyResultCard: FC<DailyResultCardProps> = React.memo(({ results }) => {
  const { colors } = useThemeContext();

  return (
    <View style={styles.container}>
      {results.map((correct, index) => (
        <ResultSquare
          key={index}
          correct={correct}
          index={index}
          colors={colors}
        />
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: s(6),
    justifyContent: 'center',
  },
  square: {
    width: s(22),
    height: s(22),
  },
});
