import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useThemeContext } from '@/theme';
import { fontFamily } from '@/theme/typography';
import type { FC, ReactNode } from 'react';

type ListItemVariant = 'default' | 'card';

type ListItemProps = {
  title: string;
  subtitle?: string;
  left?: ReactNode;
  right?: ReactNode;
  rightText?: string;
  showChevron?: boolean;
  variant?: ListItemVariant;
  onPress?: () => void;
  accessibilityLabel?: string;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const ListItem: FC<ListItemProps> = ({
  title,
  subtitle,
  left,
  right,
  rightText,
  showChevron = false,
  variant = 'default',
  onPress,
  accessibilityLabel,
}) => {
  const { colors, borderRadius, elevation } = useThemeContext();
  const scale = useSharedValue(1);

  const isCard = variant === 'card';

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  const content = (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          borderRadius: isCard ? borderRadius.lg : 0,
        },
        isCard && {
          ...elevation.sm,
          borderWidth: 1,
          borderColor: colors.border,
        },
      ]}
    >
      {left && <View style={styles.left}>{left}</View>}
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
        {subtitle && (
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{subtitle}</Text>
        )}
      </View>
      {rightText && (
        <Text style={[styles.rightText, { color: colors.textSecondary }]}>{rightText}</Text>
      )}
      {right}
      {showChevron && (
        <Feather name="chevron-right" size={18} color={colors.textTertiary} />
      )}
    </View>
  );

  if (onPress) {
    return (
      <AnimatedPressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress}
        accessibilityLabel={accessibilityLabel ?? title}
        accessibilityRole="button"
        style={animatedStyle}
      >
        {content}
      </AnimatedPressable>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    minHeight: 48,
  },
  left: {
    marginRight: 14,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontFamily: fontFamily.regular,
    lineHeight: 22,
  },
  subtitle: {
    fontSize: 13,
    fontFamily: fontFamily.regular,
    lineHeight: 18,
    marginTop: 2,
  },
  rightText: {
    fontSize: 14,
    fontFamily: fontFamily.regular,
    marginRight: 4,
  },
});
