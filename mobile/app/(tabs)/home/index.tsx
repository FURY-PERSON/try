import React from 'react';
import { View, ScrollView, RefreshControl, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Screen } from '@/components/layout/Screen';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Skeleton } from '@/components/feedback/Skeleton';
import { ErrorState } from '@/components/feedback/ErrorState';
import { AdBanner } from '@/components/ads/AdBanner';
import { StreakBadge } from '@/features/game/components/StreakBadge';
import { useDailySet } from '@/features/game/hooks/useDailySet';
import { useUserStore } from '@/stores/useUserStore';
import { useThemeContext } from '@/theme';
import { useGameStore } from '@/features/game/stores/useGameStore';
import { CARDS_PER_DAILY_SET } from '@/shared';

export default function HomeScreen() {
  const { colors, spacing, typography } = useThemeContext();
  const { t } = useTranslation();
  const router = useRouter();
  const streak = useUserStore((s) => s.currentStreak);
  const { data, isLoading, isError, error, refetch, isRefetching } = useDailySet();
  const startDailySet = useGameStore((s) => s.startDailySet);

  const handleStartDaily = () => {
    if (data) {
      startDailySet(data.id ?? null, data.questions?.length ?? CARDS_PER_DAILY_SET);
      router.push('/game/card');
    }
  };

  if (isLoading) {
    return (
      <Screen>
        <View style={styles.header}>
          <Text style={[styles.largeTitle, { color: colors.textPrimary }]}>{t('home.title')}</Text>
          <StreakBadge days={streak} />
        </View>
        <View style={styles.skeletons}>
          <Skeleton width="100%" height={200} shape="card" />
        </View>
      </Screen>
    );
  }

  if (isError) {
    return (
      <Screen>
        <ErrorState message={error?.message} onRetry={refetch} />
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        <View style={styles.header}>
          <Text style={[styles.largeTitle, { color: colors.textPrimary }]}>{t('home.title')}</Text>
          <StreakBadge days={streak} />
        </View>

        <Card variant="highlighted" style={{ marginTop: spacing.xl }}>
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
            {t('home.dailySet')}
          </Text>
          {data?.theme && (
            <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
              {t('home.dailyTheme', { theme: data.theme })}
            </Text>
          )}
          <Text style={[styles.cardDesc, { color: colors.textSecondary }]}>
            {t('home.dailyDesc')}
          </Text>
          <View style={styles.progressRow}>
            <ProgressBar progress={0} variant="primary" />
            <Text style={[styles.progressText, { color: colors.textSecondary }]}>
              {t('home.progress', { current: 0, total: data?.questions?.length ?? CARDS_PER_DAILY_SET })}
            </Text>
          </View>
          <Button
            label={t('common.play')}
            variant="primary"
            size="lg"
            onPress={handleStartDaily}
            iconLeft={<Text style={{ fontSize: 16 }}>▶</Text>}
          />
        </Card>

        <View style={{ marginTop: spacing.sectionGap }}>
          <AdBanner placement="home_bottom" />
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 44,
  },
  largeTitle: {
    fontSize: 34,
    fontFamily: 'Nunito_700Bold',
    letterSpacing: 0.37,
  },
  skeletons: {
    marginTop: 24,
  },
  cardTitle: {
    fontSize: 20,
    fontFamily: 'Nunito_700Bold',
    lineHeight: 25,
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 15,
    fontFamily: 'Nunito_600SemiBold',
    lineHeight: 20,
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 15,
    fontFamily: 'Nunito_400Regular',
    lineHeight: 20,
    marginBottom: 16,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  progressText: {
    fontSize: 13,
    fontFamily: 'Nunito_600SemiBold',
    minWidth: 30,
  },
});
