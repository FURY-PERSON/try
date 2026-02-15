import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Screen } from '@/components/layout/Screen';
import { Chip } from '@/components/ui/Chip';
import { Skeleton } from '@/components/feedback/Skeleton';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { AdBanner } from '@/components/ads/AdBanner';
import { LeaderboardList } from '@/features/leaderboard/components/LeaderboardList';
import { useLeaderboard } from '@/features/leaderboard/hooks/useLeaderboard';
import { useThemeContext } from '@/theme';

type Period = 'daily' | 'weekly' | 'alltime';

export default function LeaderboardScreen() {
  const { colors, spacing } = useThemeContext();
  const { t } = useTranslation();
  const [period, setPeriod] = useState<Period>('daily');
  const { data, isLoading, isError, error, refetch } = useLeaderboard(period);

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>
          🏆 {t('leaderboard.title')}
        </Text>
      </View>

      <View style={styles.tabs}>
        <Chip
          label={t('leaderboard.daily')}
          variant="primary"
          selected={period === 'daily'}
          onPress={() => setPeriod('daily')}
        />
        <Chip
          label={t('leaderboard.weekly')}
          variant="primary"
          selected={period === 'weekly'}
          onPress={() => setPeriod('weekly')}
        />
        <Chip
          label={t('leaderboard.allTime')}
          variant="primary"
          selected={period === 'alltime'}
          onPress={() => setPeriod('alltime')}
        />
      </View>

      {isLoading ? (
        <View style={styles.skeletons}>
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} width="100%" height={60} shape="card" style={{ marginBottom: 8 }} />
          ))}
        </View>
      ) : isError ? (
        <ErrorState message={error?.message} onRetry={refetch} />
      ) : !data || data.length === 0 ? (
        <EmptyState title={t('leaderboard.empty')} />
      ) : (
        <LeaderboardList data={data} />
      )}

      <View style={{ marginTop: spacing.lg }}>
        <AdBanner placement="leaderboard_bottom" />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 56,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontFamily: 'Nunito_800ExtraBold',
  },
  tabs: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  skeletons: {
    marginTop: 8,
  },
});
