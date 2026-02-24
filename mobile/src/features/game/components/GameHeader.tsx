import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { StreakBadge } from './StreakBadge';
import { useThemeContext } from '@/theme';
import type { FC } from 'react';

type GameHeaderProps = {
  progress: number;
  streak: number;
  onClose?: () => void;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const GameHeader: FC<GameHeaderProps> = ({ progress, streak, onClose }) => {
  const { colors, spacing, borderRadius } = useThemeContext();
  const router = useRouter();
  const closeScale = useSharedValue(1);

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      router.back();
    }
  };

  const closeAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: closeScale.value }],
  }));

  return (
    <View style={[styles.container, { paddingHorizontal: spacing.screenPadding }]}>
      <AnimatedPressable
        onPressIn={() => {
          closeScale.value = withSpring(0.9, { damping: 15, stiffness: 300 });
        }}
        onPressOut={() => {
          closeScale.value = withSpring(1, { damping: 15, stiffness: 300 });
        }}
        onPress={handleClose}
        accessibilityLabel="Close game"
        accessibilityRole="button"
        style={[
          styles.closeButton,
          {
            backgroundColor: colors.surfaceVariant,
            borderRadius: borderRadius.full,
          },
          closeAnimatedStyle,
        ]}
      >
        <Feather name="x" size={20} color={colors.textSecondary} />
      </AnimatedPressable>
      <View style={styles.progressContainer}>
        <ProgressBar progress={progress} variant="primary" height={8} />
      </View>
      <StreakBadge days={streak} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    gap: 12,
  },
  closeButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressContainer: {
    flex: 1,
  },
});
