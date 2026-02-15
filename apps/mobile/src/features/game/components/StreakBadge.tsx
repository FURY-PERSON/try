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
          backgroundColor: colors.orange,
          paddingHorizontal: isMd ? 14 : 10,
          paddingVertical: isMd ? 8 : 4,
        },
      ]}
    >
      <Animated.View style={animatedStyle}>
        <MaterialCommunityIcons
          name="fire"
          size={isMd ? 20 : 16}
          color="#FFFFFF"
        />
      </Animated.View>
      <Text style={[styles.text, isMd && styles.textMd]}>{days}</Text>
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
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Nunito_900Black',
  },
  textMd: {
    fontSize: 18,
  },
});
