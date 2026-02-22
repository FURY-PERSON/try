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
  const { colors, borderRadius, duoShadow } = useThemeContext();

  const isCard = variant === 'card';

  const content = (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          borderRadius: borderRadius.lg,
        },
        isCard && {
          ...duoShadow.card,
          borderColor: colors.border,
          borderBottomColor: colors.borderDark,
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
        <Feather name="chevron-right" size={20} color={colors.textSecondary} />
      )}
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityLabel={accessibilityLabel ?? title}
        accessibilityRole="button"
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
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  left: {
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontFamily: 'Nunito_700Bold',
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
    marginRight: 8,
  },
});
