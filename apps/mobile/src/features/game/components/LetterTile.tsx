import React from 'react';
import { Text, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { useThemeContext } from '@/theme';
import { haptics } from '@/utils/haptics';
import type { FC } from 'react';
import type { LetterTileState } from '../types';

type LetterTileProps = {
  letter: string;
  state?: LetterTileState;
  size?: number;
  onPress?: () => void;
  disabled?: boolean;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const TILE_DEPTH = 3;

export const LetterTile: FC<LetterTileProps> = ({
  letter,
  state = 'default',
  size = 44,
  onPress,
  disabled = false,
}) => {
  const { colors, borderRadius } = useThemeContext();
  const pressed = useSharedValue(0);

  const stateColors: Record<LetterTileState, { border: string; borderBottom: string; bg: string }> = {
    default: { border: colors.border, borderBottom: colors.borderDark, bg: colors.surface },
    selected: { border: colors.blue, borderBottom: colors.blueDark, bg: colors.surface },
    correct: { border: colors.primary, borderBottom: colors.primaryDark, bg: colors.primary },
    incorrect: { border: colors.red, borderBottom: colors.redDark, bg: colors.red },
    hint: { border: colors.purple, borderBottom: colors.purpleDark, bg: colors.surface },
    misplaced: { border: colors.gold, borderBottom: colors.goldDark, bg: colors.gold },
  };

  const tileColors = stateColors[state];
  const isColored = state === 'correct' || state === 'incorrect' || state === 'misplaced';

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: pressed.value * TILE_DEPTH }],
    borderBottomWidth: TILE_DEPTH - pressed.value * TILE_DEPTH,
  }));

  const handlePressIn = () => {
    pressed.value = withTiming(1, { duration: 50 });
  };

  const handlePressOut = () => {
    pressed.value = withTiming(0, { duration: 100 });
  };

  const handlePress = () => {
    if (disabled) return;
    haptics.light();
    onPress?.();
  };

  return (
    <AnimatedPressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      disabled={disabled || !onPress}
      accessibilityLabel={`Letter ${letter}`}
      accessibilityRole="button"
      style={[
        styles.tile,
        {
          width: size,
          height: size + TILE_DEPTH,
          borderRadius: borderRadius.md,
          backgroundColor: tileColors.bg,
          borderColor: tileColors.border,
          borderBottomColor: tileColors.borderBottom,
          borderWidth: 2,
        },
        animatedStyle,
      ]}
    >
      <Text
        style={[
          styles.letter,
          {
            color: isColored ? '#FFFFFF' : colors.textPrimary,
            fontSize: size > 40 ? 20 : 16,
          },
        ]}
      >
        {letter.toUpperCase()}
      </Text>
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  tile: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  letter: {
    fontFamily: 'Nunito_700Bold',
  },
});
