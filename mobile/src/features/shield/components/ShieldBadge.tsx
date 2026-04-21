import React, { useCallback } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useThemeContext } from '@/theme';
import { fontFamily } from '@/theme/typography';
import { haptics } from '@/utils/haptics';
import { s } from '@/utils/scale';
import type { FC } from 'react';

type ShieldBadgeProps = {
  count: number;
  onPress: () => void;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const ShieldBadge: FC<ShieldBadgeProps> = React.memo(({ count, onPress }) => {
  const { colors } = useThemeContext();
  const scale = useSharedValue(1);

  const handlePress = useCallback(() => {
    haptics.light();
    scale.value = withTiming(0.9, { duration: 100 });
    setTimeout(() => {
      scale.value = withTiming(1, { duration: 120 });
    }, 100);
    onPress();
  }, [onPress, scale]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const color = count > 0 ? '#3B82F6' : colors.textTertiary;

  return (
    <AnimatedPressable onPress={handlePress} hitSlop={6} style={animStyle}>
      <View style={[styles.badge, { backgroundColor: color + '15' }]}>
        <MaterialCommunityIcons
          name="shield-outline"
          size={s(16)}
          color={color}
        />
        <Text style={[styles.text, { color }]}>
          {count}
        </Text>
      </View>
    </AnimatedPressable>
  );
});

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(3),
    paddingHorizontal: s(8),
    paddingVertical: s(4),
    borderRadius: s(9999),
  },
  text: {
    fontSize: s(14),
    fontFamily: fontFamily.bold,
  },
});
