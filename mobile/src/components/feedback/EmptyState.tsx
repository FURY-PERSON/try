import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useThemeContext } from '@/theme';
import { fontFamily } from '@/theme/typography';
import { Button } from '@/components/ui/Button';
import type { FC, ReactNode } from 'react';
import { s } from '@/utils/scale';

type EmptyStateProps = {
  title: string;
  description?: string;
  icon?: ReactNode;
  actionLabel?: string;
  onAction?: () => void;
};

export const EmptyState: FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  actionLabel,
  onAction,
}) => {
  const { colors, borderRadius } = useThemeContext();

  return (
    <View style={styles.container}>
      <View style={[styles.iconContainer, { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.xxl }]}>
        {icon ?? <Feather name="inbox" size={32} color={colors.textTertiary} />}
      </View>
      <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
      {description && (
        <Text style={[styles.description, { color: colors.textSecondary }]}>{description}</Text>
      )}
      {actionLabel && onAction && (
        <View style={styles.action}>
          <Button label={actionLabel} variant="primary" onPress={onAction} fullWidth={false} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: s(48),
  },
  iconContainer: {
    width: s(72),
    height: s(72),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: s(20),
  },
  title: {
    fontSize: s(20),
    fontFamily: fontFamily.bold,
    lineHeight: s(26),
    textAlign: 'center',
  },
  description: {
    fontSize: s(14),
    fontFamily: fontFamily.regular,
    lineHeight: s(20),
    textAlign: 'center',
    marginTop: s(8),
  },
  action: {
    marginTop: s(24),
  },
});
