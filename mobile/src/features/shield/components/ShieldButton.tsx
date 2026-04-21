import React, { useCallback } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  withRepeat,
  withDelay,
  interpolateColor,
} from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useThemeContext } from '@/theme';
import { fontFamily } from '@/theme/typography';
import { haptics } from '@/utils/haptics';
import { s } from '@/utils/scale';
import type { FC } from 'react';

const SIZE = s(58);
const ICON_SIZE = s(40);
const RING_SIZE = SIZE + 14;

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
  const pulseScale = useSharedValue(1);
  const ringScale = useSharedValue(1);
  const ringOpacity = useSharedValue(0);
  const shimmer = useSharedValue(0);

  const handlePress = useCallback(() => {
    if (disabled) return;

    haptics.medium();

    // Quick bounce
    scale.value = withSequence(
      withTiming(1.25, { duration: 120 }),
      withTiming(0.92, { duration: 120 }),
      withTiming(1, { duration: 160 }),
    );

    // Expanding ring on tap
    ringScale.value = 1;
    ringOpacity.value = 0.6;
    ringScale.value = withTiming(1.8, { duration: 500 });
    ringOpacity.value = withDelay(100, withTiming(0, { duration: 400 }));

    onPress();
  }, [disabled, onPress, scale, ringScale, ringOpacity]);

  React.useEffect(() => {
    if (active) {
      glowOpacity.value = withTiming(0.7, { duration: 300 });
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.1, { duration: 700 }),
          withTiming(0.97, { duration: 700 }),
        ),
        -1,
        true,
      );
      // Shimmer effect on active
      shimmer.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 1200 }),
          withTiming(0, { duration: 1200 }),
        ),
        -1,
        true,
      );
    } else {
      glowOpacity.value = withTiming(0, { duration: 200 });
      pulseScale.value = withTiming(1, { duration: 200 });
      shimmer.value = withTiming(0, { duration: 200 });
    }
  }, [active, glowOpacity, pulseScale, shimmer]);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value * pulseScale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ringScale.value }],
    opacity: ringOpacity.value,
  }));

  const circleStyle = useAnimatedStyle(() => {
    'worklet';
    const bg = active
      ? interpolateColor(shimmer.value, [0, 1], ['#2563EB', '#3B82F6'])
      : 'transparent';
    return { backgroundColor: bg };
  });

  const iconColor = active ? '#FFFFFF' : count > 0 ? '#3B82F6' : colors.textTertiary;
  const textColor = active ? '#FFFFFF' : count > 0 ? '#3B82F6' : colors.textTertiary;
  const circleBg = active ? undefined : count > 0 ? colors.surface + 'CC' : colors.surfaceVariant;
  const circleBorder = active ? '#60A5FA' : count > 0 ? '#3B82F640' : colors.border;

  return (
    <Animated.View style={[styles.wrapper, containerStyle]}>
      {/* Outer glow */}
      <Animated.View
        style={[styles.glow, glowStyle]}
        pointerEvents="none"
      />

      {/* Tap ring burst */}
      <Animated.View
        style={[styles.ring, ringStyle]}
        pointerEvents="none"
      />

      <Pressable
        onPress={handlePress}
        disabled={disabled}
        hitSlop={10}
      >
        <Animated.View
          style={[
            styles.circle,
            { borderColor: circleBorder },
            circleBg ? { backgroundColor: circleBg } : undefined,
            circleStyle,
          ]}
        >
          <View style={styles.iconWrap}>
            <MaterialCommunityIcons
              name={active ? 'shield' : 'shield-outline'}
              size={ICON_SIZE}
              color={iconColor}
            />
            <Text style={[styles.count, { color: textColor }]}>
              {count}
            </Text>
          </View>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  wrapper: {
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circle: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrap: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  count: {
    position: 'absolute',
    fontSize: s(14),
    fontFamily: fontFamily.bold,
    top: ICON_SIZE * 0.34,
  },
  glow: {
    position: 'absolute',
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    backgroundColor: '#3B82F6',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 24,
  },
  ring: {
    position: 'absolute',
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    borderWidth: 2.5,
    borderColor: '#60A5FA',
  },
});
