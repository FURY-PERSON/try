import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Screen } from '@/components/layout/Screen';
import { Button } from '@/components/ui/Button';
import { useThemeContext } from '@/theme';
import { analytics } from '@/services/analytics';

export default function StreakMilestoneModal() {
  const { colors } = useThemeContext();
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams<{ days: string }>();
  const days = parseInt(params.days ?? '0', 10);

  const titleKey =
    days >= 100
      ? 'streakMilestone.title100'
      : days >= 30
        ? 'streakMilestone.title30'
        : 'streakMilestone.title7';

  React.useEffect(() => {
    analytics.logEvent('streak_milestone', { days });
  }, [days]);

  return (
    <Screen style={styles.screen}>
      <View style={styles.content}>
        <MaterialCommunityIcons name="fire" size={100} color={colors.orange} />

        <Text style={[styles.days, { color: colors.orange }]}>{days}</Text>
        <Text style={[styles.title, { color: colors.textPrimary }]}>{t(titleKey)}</Text>
        <Text style={[styles.desc, { color: colors.textSecondary }]}>
          {t('streakMilestone.desc')}
        </Text>
      </View>

      <View style={styles.footer}>
        <Button
          label={t('common.continue')}
          variant="primary"
          size="lg"
          onPress={() => router.back()}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { justifyContent: 'space-between' },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  days: {
    fontSize: 64,
    fontFamily: 'Nunito_900Black',
  },
  title: {
    fontSize: 28,
    fontFamily: 'Nunito_800ExtraBold',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  desc: {
    fontSize: 17,
    fontFamily: 'Nunito_600SemiBold',
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
});
