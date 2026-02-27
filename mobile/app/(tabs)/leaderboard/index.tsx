import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Screen } from '@/components/layout/Screen';
import { AnimatedEntrance } from '@/components/ui/AnimatedEntrance';
import { Skeleton } from '@/components/feedback/Skeleton';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { AdBanner } from '@/components/ads/AdBanner';
import { LeaderboardList } from '@/features/leaderboard/components/LeaderboardList';
import { useLeaderboard } from '@/features/leaderboard/hooks/useLeaderboard';
import { useThemeContext } from '@/theme';
import { fontFamily } from '@/theme/typography';
import type { LeaderboardMode, LeaderboardPeriod } from '@/shared';

const MODES: LeaderboardMode[] = ['score', 'streak'];
const PERIODS: LeaderboardPeriod[] = ['weekly', 'monthly', 'yearly', 'alltime'];

export default function LeaderboardScreen() {
  const insets = useSafeAreaInsets();
  const { colors, spacing, borderRadius } = useThemeContext();
  const { t } = useTranslation();
  const [mode, setMode] = useState<LeaderboardMode>('score');
  const [period, setPeriod] = useState<LeaderboardPeriod>('weekly');
  const { data, isLoading, isError, error, refetch } = useLeaderboard(period, mode);
  const currentUserId = data?.currentUserId;
  const entries = data?.entries ?? [];

  const positionLabel = data?.userPosition
    ? t('leaderboard.position', { position: data.userPosition, total: data.totalPlayers })
    : null;

  return (
    <Screen>
      <AnimatedEntrance delay={0}>
        <View style={[styles.header, { paddingTop: insets.top }]}>
          <Text style={[styles.largeTitle, { color: colors.textPrimary }]}>
            {t('leaderboard.title')}
          </Text>
        </View>
      </AnimatedEntrance>

      <AnimatedEntrance delay={50}>
        <View style={[styles.segmentedControl, { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.lg }]}>
          {MODES.map((m) => (
            <Pressable
              key={m}
              onPress={() => setMode(m)}
              style={[
                styles.segment,
                mode === m && {
                  backgroundColor: colors.surface,
                  borderRadius: borderRadius.sm,
                },
              ]}
            >
              <Text
                style={[
                  styles.segmentText,
                  { color: mode === m ? colors.primary : colors.textSecondary },
                ]}
              >
                {t(`leaderboard.mode_${m}`)}
              </Text>
            </Pressable>
          ))}
        </View>
      </AnimatedEntrance>

      <AnimatedEntrance delay={75}>
        <View style={[styles.segmentedControl, { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.lg, marginTop: 0 }]}>
          {PERIODS.map((p) => (
            <Pressable
              key={p}
              onPress={() => setPeriod(p)}
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
              >
                {t(`leaderboard.${p === 'alltime' ? 'allTime' : p}`)}
              </Text>
            </Pressable>
          ))}
        </View>
      </AnimatedEntrance>

      <View style={{ flex: 1 }}>
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
          <AnimatedEntrance delay={100} style={{ flex: 1 }}>
            <LeaderboardList
              data={entries}
              mode={mode}
              currentUserId={currentUserId ?? undefined}
              userContext={data?.userContext}
              positionLabel={positionLabel}
            />
          </AnimatedEntrance>
        )}
      </View>

      <AdBanner placement="leaderboard_bottom" />
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
});
