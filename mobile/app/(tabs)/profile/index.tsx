import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Screen } from '@/components/layout/Screen';
import { Avatar } from '@/components/ui/Avatar';
import { Card } from '@/components/ui/Card';
import { ListItem } from '@/components/ui/ListItem';
import { Divider } from '@/components/ui/Divider';
import { AnimatedEntrance } from '@/components/ui/AnimatedEntrance';
import { Skeleton } from '@/components/feedback/Skeleton';
import { StatCard } from '@/features/profile/components/StatCard';
import { HeatmapCalendar } from '@/features/profile/components/HeatmapCalendar';
import { useStats } from '@/features/profile/hooks/useStats';
import { useUserStore } from '@/stores/useUserStore';
import { useThemeContext } from '@/theme';
import { fontFamily } from '@/theme/typography';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { colors, spacing, gradients, borderRadius } = useThemeContext();
  const { t } = useTranslation();
  const router = useRouter();
  const nickname = useUserStore((s) => s.nickname);
  const avatarEmoji = useUserStore((s) => s.avatarEmoji);
  const { data: stats, isLoading } = useStats();

  return (
    <Screen padded={false}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Profile Header with Gradient */}
        <AnimatedEntrance delay={0}>
          <LinearGradient
            colors={gradients.hero}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={[styles.profileHeader, { paddingTop: insets.top + 8 }]}
          >
            <View style={styles.headerTopRow}>
              <Text style={[styles.largeTitle, { color: colors.textPrimary }]}>
                {t('profile.title')}
              </Text>
              <Pressable
                onPress={() => router.push('/(tabs)/profile/settings')}
                accessibilityLabel="Settings"
                accessibilityRole="button"
                hitSlop={8}
                style={[styles.settingsBtn, { backgroundColor: colors.surface + '80' }]}
              >
                <Feather name="settings" size={20} color={colors.textSecondary} />
              </Pressable>
            </View>

            <View style={styles.avatarSection}>
              <Pressable onPress={() => router.push('/modal/nickname')} style={styles.avatarPressable}>
                <Avatar nickname={nickname} avatarEmoji={avatarEmoji} size="xl" />
              </Pressable>
              <Pressable onPress={() => router.push('/modal/nickname')}>
                <View style={styles.nicknameRow}>
                  <Text style={[styles.nickname, { color: colors.textPrimary }]}>
                    {nickname ?? t('profile.defaultNickname')}
                  </Text>
                  <Feather name="edit-2" size={12} color={colors.textTertiary} />
                </View>
              </Pressable>
            </View>
          </LinearGradient>
        </AnimatedEntrance>

        <View style={{ paddingHorizontal: spacing.screenPadding }}>
          {/* Stat Cards */}
          <AnimatedEntrance delay={100}>
            <View style={styles.statCards}>
              <StatCard
                icon={<MaterialCommunityIcons name="fire" size={20} color={colors.orange} />}
                value={isLoading ? 0 : (stats?.currentStreak ?? 0)}
                label={t('profile.streak')}
                accentColor={colors.orange}
              />
              <StatCard
                icon={<Feather name="star" size={20} color={colors.gold} />}
                value={isLoading ? 0 : (stats?.totalScore ?? 0)}
                label={t('profile.score')}
                accentColor={colors.gold}
              />
              <StatCard
                icon={<MaterialCommunityIcons name="book-open-variant" size={20} color={colors.blue} />}
                value={isLoading ? 0 : (stats?.factsLearned ?? 0)}
                label={t('profile.facts')}
                accentColor={colors.blue}
              />
            </View>
          </AnimatedEntrance>

          <Divider marginVertical={spacing.sectionGap} />

          {/* Activity */}
          <AnimatedEntrance delay={200}>
            <Text style={[styles.sectionOverline, { color: colors.primary }]}>
              {t('profile.activity').toUpperCase()}
            </Text>
            <Card variant="default" style={{ marginTop: spacing.md }}>
              {isLoading ? (
                <Skeleton width="100%" height={100} shape="rectangle" />
              ) : (
                <HeatmapCalendar activityMap={stats?.activityMap ?? {}} />
              )}
            </Card>
          </AnimatedEntrance>

          <Divider marginVertical={spacing.sectionGap} />

          {/* Statistics */}
          <AnimatedEntrance delay={300}>
            <Text style={[styles.sectionOverline, { color: colors.primary }]}>
              {t('profile.statistics').toUpperCase()}
            </Text>
            <Card variant="default" style={{ marginTop: spacing.md, padding: 0 }}>
              <ListItem
                title={t('profile.correctPercent')}
                rightText={isLoading ? '...' : `${stats?.correctPercent ?? 0}%`}
              />
              <ListItem
                title={t('profile.bestStreak')}
                rightText={isLoading ? '...' : String(stats?.bestStreak ?? 0)}
              />
            </Card>
          </AnimatedEntrance>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  profileHeader: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 24,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 44,
  },
  largeTitle: {
    fontSize: 32,
    fontFamily: fontFamily.bold,
    letterSpacing: -0.5,
  },
  settingsBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarSection: {
    alignItems: 'center',
    gap: 12,
    marginTop: 16,
  },
  avatarPressable: {
  },
  nickname: {
    fontSize: 18,
    fontFamily: fontFamily.semiBold,
    textAlign: 'center',
  },
  nicknameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statCards: {
    flexDirection: 'row',
    gap: 12,
    marginTop: -12,
  },
  sectionOverline: {
    fontSize: 11,
    fontFamily: fontFamily.bold,
    letterSpacing: 1.5,
    marginBottom: 4,
  },
});
