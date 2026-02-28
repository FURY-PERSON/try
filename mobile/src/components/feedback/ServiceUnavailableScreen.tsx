import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeContext } from '@/theme';
import { fontFamily } from '@/theme/typography';
import { Button } from '@/components/ui/Button';
import type { FC } from 'react';

type Props = {
  status: 'checking' | 'unavailable';
  onRetry: () => void;
};

export const ServiceUnavailableScreen: FC<Props> = ({ status, onRetry }) => {
  const { colors, borderRadius } = useThemeContext();
  const { t } = useTranslation();

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: `${colors.primary}15`, borderRadius: borderRadius.xxl },
          ]}
        >
          {status === 'checking' ? (
            <ActivityIndicator size="large" color={colors.primary} />
          ) : (
            <Feather name="cloud-off" size={36} color={colors.primary} />
          )}
        </View>

        <Text style={[styles.title, { color: colors.textPrimary }]}>
          {t('serviceUnavailable.title')}
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {t('serviceUnavailable.subtitle')}
        </Text>

        {status === 'unavailable' && (
          <View style={styles.action}>
            <Button
              label={t('common.retry')}
              variant="primary"
              onPress={onRetry}
              fullWidth={false}
            />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 48,
  },
  iconContainer: {
    width: 88,
    height: 88,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 22,
    fontFamily: fontFamily.bold,
    lineHeight: 30,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    fontFamily: fontFamily.regular,
    lineHeight: 22,
    textAlign: 'center',
    marginTop: 10,
  },
  action: {
    marginTop: 32,
  },
});
