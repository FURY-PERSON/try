import React, { useCallback } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useThemeContext } from '@/theme';
import { fontFamily } from '@/theme/typography';
import { haptics } from '@/utils/haptics';
import { s } from '@/utils/scale';
import type { FC } from 'react';

type ShieldButtonProps = {
  count: number;
  active: boolean;
  onPress: () => void;
  disabled?: boolean;
};

export const ShieldButton: FC<ShieldButtonProps> = React.memo(({
  count,
  active,
  onPress,
  disabled,
}) => {
  const { colors } = useThemeContext();
  const scale = useSharedValue(1);
  const glowOpacity = useSharedValue(0);

  const handlePress = useCallback(() => {
    if (disabled) return;

    haptics.light();
    scale.value = withSequence(
      withSpring(1.2, { damping: 8, stiffness: 400 }),
      withSpring(1, { damping: 12, stiffness: 200 }),
    );
    onPress();
  }, [disabled, onPress, scale]);

  // Glow animation when active
  React.useEffect(() => {
    if (active) {
      glowOpacity.value = withSequence(
        withTiming(0.6, { duration: 300 }),
        withTiming(0.3, { duration: 500 }),
      );
    } else {
      glowOpacity.value = withTiming(0, { duration: 200 });
    }
  }, [active, glowOpacity]);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const iconColor = active ? '#3B82F6' : count > 0 ? colors.primary : colors.textTertiary;
  const bgColor = active ? '#3B82F620' : count > 0 ? colors.primary + '15' : colors.surfaceVariant;
  const borderColor = active ? '#3B82F640' : 'transparent';

  return (
    <Animated.View style={containerStyle}>
      {/* Active glow */}
      <Animated.View
        style={[
          styles.glow,
          { backgroundColor: '#3B82F6', shadowColor: '#3B82F6' },
          glowStyle,
        ]}
        pointerEvents="none"
      />
      <Pressable
        onPress={handlePress}
        disabled={disabled}
        hitSlop={8}
        style={[
          styles.button,
          {
            backgroundColor: bgColor,
            borderColor,
            borderWidth: active ? 1.5 : 0,
          },
        ]}
      >
        <MaterialCommunityIcons
          name={active ? 'shield' : 'shield-outline'}
          size={s(18)}
          color={iconColor}
        />
        <Text style={[styles.count, { color: iconColor }]}>
          {count}
        </Text>
      </Pressable>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(3),
    paddingHorizontal: s(10),
    paddingVertical: s(5),
    borderRadius: s(9999),
  },
  count: {
    fontSize: s(14),
    fontFamily: fontFamily.bold,
  },
  glow: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: s(9999),
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 12,
  },
});
