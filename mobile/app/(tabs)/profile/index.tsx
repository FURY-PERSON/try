import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { Screen } from '@/components/layout/Screen';
import { Avatar } from '@/components/ui/Avatar';
import { Card } from '@/components/ui/Card';
import { ListItem } from '@/components/ui/ListItem';
import { Divider } from '@/components/ui/Divider';
import { Skeleton } from '@/components/feedback/Skeleton';
import { StatCard } from '@/features/profile/components/StatCard';
import { HeatmapCalendar } from '@/features/profile/components/HeatmapCalendar';
import { useStats } from '@/features/profile/hooks/useStats';
import { useUserStore } from '@/stores/useUserStore';
import { useThemeContext } from '@/theme';
import { formatPercent } from '@/utils/format';

export default function ProfileScreen() {
  const { colors, spacing } = useThemeContext();
  const { t } = useTranslation();
  const router = useRouter();
  const nickname = useUserStore((s) => s.nickname);
  const streak = useUserStore((s) => s.currentStreak);
  const totalScore = useUserStore((s) => s.totalScore);
  const factsLearned = useUserStore((s) => s.factsLearned);
  const { data: stats, isLoading } = useStats();

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        <View style={styles.header}>
          <Text style={[styles.largeTitle, { color: colors.textPrimary }]}>
            {t('profile.title')}
          </Text>
          <Pressable
            onPress={() => router.push('/(tabs)/profile/settings')}
            accessibilityLabel="Settings"
            accessibilityRole="button"
            hitSlop={8}
          >
            <Feather name="settings" size={22} color={colors.textSecondary} />
          </Pressable>
        </View>

        <View style={styles.avatarSection}>
          <Avatar nickname={nickname} size="xl" />
          <Pressable onPress={() => router.push('/modal/nickname')}>
            <Text style={[styles.nickname, { color: colors.textPrimary }]}>
              {nickname ?? 'Player'}
            </Text>
          </Pressable>
        </View>

        <View style={styles.statCards}>
          <StatCard
            icon={<MaterialCommunityIcons name="fire" size={22} color={colors.orange} />}
            value={streak}
            label={t('profile.streak')}
          />
          <StatCard
            icon={<Feather name="star" size={22} color={colors.gold} />}
            value={totalScore}
            label={t('profile.score')}
          />
          <StatCard
            icon={<MaterialCommunityIcons name="book-open-variant" size={22} color={colors.blue} />}
            value={factsLearned}
            label={t('profile.facts')}
          />
        </View>

        <Divider marginVertical={spacing.sectionGap} />

        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
          {t('profile.activity')}
        </Text>
        <Card variant="flat" style={{ marginTop: spacing.md }}>
          {isLoading ? (
            <Skeleton width="100%" height={100} shape="rectangle" />
          ) : (
            <HeatmapCalendar activityMap={stats?.activityMap ?? {}} />
          )}
        </Card>

        <Divider marginVertical={spacing.sectionGap} />

        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
          {t('profile.statistics')}
        </Text>
        <Card variant="flat" style={{ marginTop: spacing.md, padding: 0 }}>
          <ListItem
            title={t('profile.totalGames')}
            rightText={isLoading ? '...' : String(stats?.totalGames ?? 0)}
          />
          <ListItem
            title={t('profile.correctPercent')}
            rightText={isLoading ? '...' : `${stats?.correctPercent ?? 0}%`}
          />
          <ListItem
            title={t('profile.bestStreak')}
            rightText={isLoading ? '...' : String(stats?.bestStreak ?? 0)}
          />
          <ListItem
            title={t('profile.avgScore')}
            rightText={isLoading ? '...' : `${stats?.avgScore?.toFixed(1) ?? '0'}/5`}
          />
        </Card>
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
  avatarSection: {
    alignItems: 'center',
    gap: 12,
    marginTop: 12,
  },
  nickname: {
    fontSize: 17,
    fontFamily: 'Nunito_600SemiBold',
  },
  statCards: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Nunito_700Bold',
    lineHeight: 25,
  },
});
