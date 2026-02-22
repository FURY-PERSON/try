import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useThemeContext } from '@/theme';
import { Button } from '@/components/ui/Button';
import type { FC } from 'react';

type ErrorStateProps = {
  message?: string;
  onRetry?: () => void;
};

export const ErrorState: FC<ErrorStateProps> = ({ message, onRetry }) => {
  const { colors } = useThemeContext();
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
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
  title: {
    fontSize: 20,
    fontFamily: 'Nunito_700Bold',
    lineHeight: 28,
    textAlign: 'center',
  },
  message: {
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
