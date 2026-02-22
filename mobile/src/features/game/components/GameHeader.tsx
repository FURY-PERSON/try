import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
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

export const GameHeader: FC<GameHeaderProps> = ({ progress, streak, onClose }) => {
  const { colors, spacing } = useThemeContext();
  const router = useRouter();

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      router.back();
    }
  };

  return (
    <View style={[styles.container, { paddingHorizontal: spacing.screenPadding }]}>
      <Pressable
        onPress={handleClose}
        accessibilityLabel="Close game"
        accessibilityRole="button"
        style={styles.closeButton}
      >
        <Feather name="x" size={24} color={colors.textSecondary} />
      </Pressable>
      <View style={styles.progressContainer}>
        <ProgressBar progress={progress} variant="primary" />
      </View>
      <StreakBadge days={streak} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    gap: 12,
  },
  closeButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressContainer: {
    flex: 1,
  },
});
