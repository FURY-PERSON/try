import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useThemeContext } from '@/theme';
import type { FC } from 'react';

type StreakBadgeProps = {
  days: number;
  animated?: boolean;
  size?: 'sm' | 'md';
};

export const StreakBadge: FC<StreakBadgeProps> = ({
  days,
  animated = true,
  size = 'sm',
}) => {
  const { colors } = useThemeContext();
  const rotation = useSharedValue(0);

  useEffect(() => {
    if (animated) {
      rotation.value = withRepeat(
        withSequence(
          withTiming(-5, { duration: 100 }),
          withTiming(5, { duration: 200 }),
          withTiming(0, { duration: 100 }),
        ),
        3,
        false,
      );
    }
  }, [animated, rotation]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const isMd = size === 'md';

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.orange + '18',
          paddingHorizontal: isMd ? 14 : 10,
          paddingVertical: isMd ? 7 : 4,
        },
      ]}
    >
      <Animated.View style={animatedStyle}>
        <MaterialCommunityIcons
          name="fire"
          size={isMd ? 20 : 16}
          color={colors.orange}
        />
      </Animated.View>
      <Text style={[styles.text, { color: colors.orange }, isMd && styles.textMd]}>{days}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 9999,
    gap: 4,
  },
  text: {
    fontSize: 14,
    fontFamily: 'Nunito_700Bold',
  },
  textMd: {
    fontSize: 18,
  },
});
