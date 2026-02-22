import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useThemeContext } from '@/theme';
import { Button } from '@/components/ui/Button';
import type { FC } from 'react';

type EmptyStateProps = {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
};

export const EmptyState: FC<EmptyStateProps> = ({
  title,
  description,
  actionLabel,
  onAction,
}) => {
  const { colors } = useThemeContext();

  return (
    <View style={styles.container}>
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
    padding: 48,
  },
  title: {
    fontSize: 20,
    fontFamily: 'Nunito_700Bold',
    lineHeight: 28,
    textAlign: 'center',
  },
  description: {
    fontSize: 15,
    fontFamily: 'Nunito_400Regular',
    lineHeight: 22,
    textAlign: 'center',
    marginTop: 8,
  },
  action: {
    marginTop: 20,
  },
});
