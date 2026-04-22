import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useThemeContext } from '@/theme';
import { fontFamily } from '@/theme/typography';
import { s } from '@/utils/scale';
import type { DailyLoginRewardItem, DailyLoginStatus } from '../types';

const SHIELD_COLOR = '#3B82F6';
const FIRE_COLOR = '#F59E0B';

type ProgressionItem =
  | { key: string; kind: 'day'; reward: DailyLoginRewardItem }
  | { key: string; kind: 'max' };

function buildItems(status: DailyLoginStatus): ProgressionItem[] {
  const items: ProgressionItem[] = status.progression.map((r) => ({
    key: `d-${r.day}`,
    kind: 'day',
    reward: r,
  }));

  const last = status.progression[status.progression.length - 1];
  const reachesMax =
    last &&
    last.shields >= status.capShields &&
    last.streak >= status.capStreak;

  if (!reachesMax) {
    items.push({ key: 'max', kind: 'max' });
  }

  return items;
}

export type ProgressionStripProps = {
  status: DailyLoginStatus;
  /** Для модалки: переопределяем "текущий" день (который был claim'нут прямо сейчас) */
  currentDay?: number;
  contentPaddingHorizontal?: number;
  bleedHorizontal?: number;
};

export function ProgressionStrip({
  status,
  currentDay,
  contentPaddingHorizontal = s(20),
  bleedHorizontal = s(20),
}: ProgressionStripProps) {
  const { colors, borderRadius, elevation } = useThemeContext();
  const { t } = useTranslation();

  const items = buildItems(status);
  const activeDay = currentDay ?? (status.claimedToday ? status.loginStreak : null);
  const nextDay = status.next.day;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{
        gap: s(10),
        paddingHorizontal: contentPaddingHorizontal,
        paddingVertical: s(4),
      }}
      style={{ marginHorizontal: -bleedHorizontal }}
    >
      {items.map((item) => {
        if (item.kind === 'max') {
          return (
            <View
              key={item.key}
              style={[
                styles.card,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  borderRadius: borderRadius.xl,
                  ...elevation.sm,
                },
              ]}
            >
              <View style={[styles.accent, { backgroundColor: colors.gold }]} />
              <Text style={[styles.label, { color: colors.gold }]}>
                {t('profile.dailyBonus.max')}
              </Text>
              <RewardBlock shields={status.capShields} streak={status.capStreak} colors={colors} />
            </View>
          );
        }

        const reward = item.reward;
        const isPast = activeDay !== null && reward.day < activeDay;
        const isCurrent = activeDay !== null && reward.day === activeDay;
        const isNext = reward.day === nextDay && !isCurrent;

        const accentColor = isCurrent
          ? colors.success
          : isNext
            ? colors.primary
            : colors.border;
        const labelColor = isCurrent
          ? colors.success
          : isNext
            ? colors.primary
            : colors.textSecondary;

        return (
          <View
            key={item.key}
            style={[
              styles.card,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                borderRadius: borderRadius.xl,
                ...elevation.sm,
                opacity: isPast ? 0.55 : 1,
              },
            ]}
          >
            <View style={[styles.accent, { backgroundColor: accentColor }]} />
            <Text style={[styles.label, { color: labelColor }]}>
              {isPast ? '✓' : t('profile.dailyBonus.dayN', { day: reward.day })}
            </Text>
            <RewardBlock shields={reward.shields} streak={reward.streak} colors={colors} />
          </View>
        );
      })}
    </ScrollView>
  );
}

function RewardBlock({
  shields,
  streak,
  colors,
}: {
  shields: number;
  streak: number;
  colors: Record<string, string>;
}) {
  return (
    <View style={styles.rewardBlock}>
      <View style={styles.rewardLine}>
        <MaterialCommunityIcons name="shield-check" size={s(14)} color={SHIELD_COLOR} />
        <Text style={[styles.rewardValue, { color: colors.textPrimary }]}>+{shields}</Text>
      </View>
      {streak > 0 ? (
        <View style={styles.rewardLine}>
          <MaterialCommunityIcons name="fire" size={s(14)} color={FIRE_COLOR} />
          <Text style={[styles.rewardValue, { color: colors.textPrimary }]}>+{streak}</Text>
        </View>
      ) : (
        <View style={styles.rewardLine}>
          <Text style={[styles.rewardPlaceholder, { color: colors.textTertiary }]}>—</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: s(90),
    paddingTop: s(14),
    paddingBottom: s(12),
    paddingHorizontal: s(10),
    borderWidth: 1,
    alignItems: 'center',
    gap: s(10),
    overflow: 'hidden',
  },
  accent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
  },
  label: {
    fontSize: s(13),
    fontFamily: fontFamily.bold,
    letterSpacing: 0.2,
  },
  rewardBlock: {
    gap: s(4),
    alignItems: 'center',
  },
  rewardLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(4),
  },
  rewardValue: {
    fontSize: s(13),
    fontFamily: fontFamily.semiBold,
  },
  rewardPlaceholder: {
    fontSize: s(13),
    fontFamily: fontFamily.regular,
  },
});
