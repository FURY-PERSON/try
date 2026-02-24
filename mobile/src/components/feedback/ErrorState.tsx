import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useThemeContext } from '@/theme';
import { fontFamily } from '@/theme/typography';
import { Button } from '@/components/ui/Button';
import type { FC } from 'react';

type ErrorStateProps = {
  message?: string;
  onRetry?: () => void;
};

export const ErrorState: FC<ErrorStateProps> = ({ message, onRetry }) => {
  const { colors, borderRadius } = useThemeContext();
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <View style={[styles.iconContainer, { backgroundColor: `${colors.red}15`, borderRadius: borderRadius.xxl }]}>
        <Feather name="alert-circle" size={32} color={colors.red} />
      </View>
      <Text style={[styles.title, { color: colors.textPrimary }]}>{t('error.title')}</Text>
      <Text style={[styles.message, { color: colors.textSecondary }]}>
        {message ?? t('error.generic')}
      </Text>
      {onRetry && (
        <View style={styles.action}>
          <Button label={t('common.retry')} variant="primary" onPress={onRetry} fullWidth={false} />
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
  iconContainer: {
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontFamily: fontFamily.bold,
    lineHeight: 26,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    fontFamily: fontFamily.regular,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 8,
  },
  action: {
    marginTop: 24,
  },
});
