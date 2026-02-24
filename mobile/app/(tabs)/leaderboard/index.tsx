import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Screen } from '@/components/layout/Screen';
import { Chip } from '@/components/ui/Chip';
import { AnimatedEntrance } from '@/components/ui/AnimatedEntrance';
import { Skeleton } from '@/components/feedback/Skeleton';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { AdBanner } from '@/components/ads/AdBanner';
import { LeaderboardList } from '@/features/leaderboard/components/LeaderboardList';
import { useLeaderboard } from '@/features/leaderboard/hooks/useLeaderboard';
import { useThemeContext } from '@/theme';
import { fontFamily } from '@/theme/typography';

type Period = 'weekly' | 'monthly' | 'yearly' | 'alltime';

export default function LeaderboardScreen() {
  const { colors, spacing, borderRadius } = useThemeContext();
  const { t } = useTranslation();
  const [period, setPeriod] = useState<Period>('weekly');
  const { data, isLoading, isError, error, refetch } = useLeaderboard(period);
  const entries = data?.entries ?? [];

  return (
    <Screen>
      <AnimatedEntrance delay={0}>
        <View style={styles.header}>
          <Text style={[styles.largeTitle, { color: colors.textPrimary }]}>
            {t('leaderboard.title')}
          </Text>
        </View>
      </AnimatedEntrance>

      <AnimatedEntrance delay={50}>
        <View style={[styles.segmentedControl, { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.lg }]}>
          {(['weekly', 'monthly', 'yearly', 'alltime'] as Period[]).map((p) => (
            <View
              key={p}
              style={[
                styles.segment,
                period === p && {
                  backgroundColor: colors.surface,
                  borderRadius: borderRadius.sm,
                },
              ]}
            >
              <Text
                style={[
                  styles.segmentText,
                  { color: period === p ? colors.primary : colors.textSecondary },
                ]}
                onPress={() => setPeriod(p)}
              >
                {t(`leaderboard.${p === 'alltime' ? 'allTime' : p}`)}
              </Text>
            </View>
          ))}
        </View>
      </AnimatedEntrance>

      {isLoading ? (
        <View style={styles.skeletons}>
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} width="100%" height={56} shape="card" style={{ marginBottom: 8 }} />
          ))}
        </View>
      ) : isError ? (
        <ErrorState message={error?.message} onRetry={refetch} />
      ) : entries.length === 0 ? (
        <EmptyState title={t('leaderboard.empty')} />
      ) : (
        <AnimatedEntrance delay={100}>
          <>
            <LeaderboardList data={entries} />
            {data?.userPosition && (
              <View style={[styles.positionFooter, { backgroundColor: colors.primary + '10', borderRadius: borderRadius.lg }]}>
                <Text style={[styles.positionText, { color: colors.primary }]}>
                  {t('leaderboard.position', {
                    position: data.userPosition,
                    total: data.totalPlayers,
                  })}
                </Text>
              </View>
            )}
          </>
        </AnimatedEntrance>
      )}

      <View style={{ marginTop: spacing.lg }}>
        <AdBanner placement="leaderboard_bottom" />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    minHeight: 44,
    justifyContent: 'center',
  },
  largeTitle: {
    fontSize: 32,
    fontFamily: fontFamily.bold,
    letterSpacing: -0.5,
  },
  segmentedControl: {
    flexDirection: 'row',
    padding: 4,
    marginTop: 12,
    marginBottom: 16,
  },
  segment: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentText: {
    fontSize: 13,
    fontFamily: fontFamily.semiBold,
  },
  skeletons: {
    marginTop: 8,
  },
  positionFooter: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginTop: 8,
  },
  positionText: {
    fontSize: 15,
    fontFamily: fontFamily.semiBold,
  },
});
