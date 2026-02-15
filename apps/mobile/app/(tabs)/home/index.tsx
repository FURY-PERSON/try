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

export default function HomeScreen() {
  const { colors, spacing } = useThemeContext();
  const { t } = useTranslation();
  const router = useRouter();
  const streak = useUserStore((s) => s.currentStreak);
  const { data, isLoading, isError, error, refetch, isRefetching } = useDailySet();
  const startDailySet = useGameStore((s) => s.startDailySet);

  const handleStartDaily = () => {
    if (data) {
      startDailySet(data.questions?.length ?? 5);
      router.push('/game/daily');
    }
  };

  const handleStartInfinite = () => {
    router.push('/game/anagram');
  };

  if (isLoading) {
    return (
      <Screen>
        <View style={styles.header}>
          <Text style={[styles.logo, { color: colors.primary }]}>{t('home.title')}</Text>
          <StreakBadge days={streak} />
        </View>
        <View style={styles.skeletons}>
          <Skeleton width="100%" height={200} shape="card" />
          <Skeleton width="100%" height={140} shape="card" style={{ marginTop: 16 }} />
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
          <Text style={[styles.logo, { color: colors.primary }]}>{t('home.title')}</Text>
          <StreakBadge days={streak} />
        </View>

        <Card variant="highlighted" style={{ marginTop: spacing.sectionGap }}>
          <Text style={[styles.cardEmoji, { color: colors.textPrimary }]}>📅</Text>
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
            {t('home.dailySet')}
          </Text>
          {data?.theme && (
            <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
              {t('home.dailyTheme', { theme: data.theme })}
            </Text>
          )}
          <View style={styles.progressRow}>
            <ProgressBar progress={0} variant="primary" />
            <Text style={[styles.progressText, { color: colors.textSecondary }]}>
              {t('home.progress', { current: 0, total: data?.questions?.length ?? 5 })}
            </Text>
          </View>
          <Button
            label={t('common.continue')}
            variant="primary"
            size="lg"
            onPress={handleStartDaily}
            iconLeft={<Text style={{ fontSize: 16 }}>▶</Text>}
          />
        </Card>

        <Card
          variant="highlighted"
          highlightColor={colors.blue}
          style={{ marginTop: spacing.lg }}
        >
          <Text style={[styles.cardEmoji, { color: colors.textPrimary }]}>♾️</Text>
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
            {t('home.infiniteMode')}
          </Text>
          <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
            {t('home.infiniteDesc')}
          </Text>
          <Button
            label={t('common.play')}
            variant="blue"
            size="lg"
            onPress={handleStartInfinite}
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
    height: 56,
  },
  logo: {
    fontSize: 24,
    fontFamily: 'Nunito_800ExtraBold',
  },
  skeletons: {
    marginTop: 24,
  },
  cardEmoji: {
    fontSize: 20,
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 20,
    fontFamily: 'Nunito_700Bold',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 15,
    fontFamily: 'Nunito_400Regular',
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
