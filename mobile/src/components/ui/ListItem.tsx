import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useThemeContext } from '@/theme';
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

  const isCard = variant === 'card';

  const content = (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          borderRadius: isCard ? borderRadius.lg : 0,
        },
        isCard && elevation.sm,
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
      <Pressable
        onPress={onPress}
        accessibilityLabel={accessibilityLabel ?? title}
        accessibilityRole="button"
        style={({ pressed }) => pressed && styles.pressed}
      >
        {content}
      </Pressable>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    paddingHorizontal: 16,
    minHeight: 44,
  },
  left: {
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 17,
    fontFamily: 'Nunito_400Regular',
    lineHeight: 22,
  },
  subtitle: {
    fontSize: 13,
    fontFamily: 'Nunito_400Regular',
    lineHeight: 18,
    marginTop: 2,
  },
  rightText: {
    fontSize: 15,
    fontFamily: 'Nunito_400Regular',
    marginRight: 4,
  },
  pressed: {
    opacity: 0.7,
  },
});
