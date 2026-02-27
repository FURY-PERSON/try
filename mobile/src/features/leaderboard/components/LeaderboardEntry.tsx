import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { useTranslation } from 'react-i18next';
import { useThemeContext } from '@/theme';
import { fontFamily } from '@/theme/typography';
import type { LeaderboardEntry as LeaderboardEntryType, LeaderboardMode } from '@/shared';
import type { FC } from 'react';

type LeaderboardEntryProps = {
  entry: LeaderboardEntryType;
  rank: number;
  isCurrentUser?: boolean;
  mode?: LeaderboardMode;
};

const MEDAL_EMOJI: Record<number, string> = {
  1: '\u{1F947}',
  2: '\u{1F948}',
  3: '\u{1F949}',
};

function getDisplayValue(entry: LeaderboardEntryType, mode: LeaderboardMode): string {
  switch (mode) {
    case 'streak':
      return String(entry.bestStreak ?? 0);
    default:
      return String(entry.score);
  }
}

export const LeaderboardEntry: FC<LeaderboardEntryProps> = ({
  entry,
  rank,
  isCurrentUser = false,
  mode = 'score',
}) => {
  const { colors, elevation, borderRadius } = useThemeContext();
  const { t } = useTranslation();
  const isTop3 = rank <= 3;
  const medal = MEDAL_EMOJI[rank];
  const displayValue = getDisplayValue(entry, mode);

  if (isTop3) {
    const podiumGradient: [string, string] =
      rank === 1
        ? [colors.gold + '20', colors.gold + '08']
        : rank === 2
          ? [colors.textTertiary + '15', colors.textTertiary + '05']
          : [colors.orange + '15', colors.orange + '05'];

    const podiumBorderColor =
      rank === 1 ? colors.gold : rank === 2 ? colors.textTertiary : colors.orange;

    return (
      <View style={[styles.topCard, { ...elevation.md, borderRadius: borderRadius.xl }]}>
        <LinearGradient
          colors={isCurrentUser ? [colors.primary + '20', colors.primary + '08'] : podiumGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.topCardInner,
            {
              borderRadius: borderRadius.xl,
              borderWidth: isCurrentUser ? 2 : 1.5,
              borderColor: isCurrentUser ? colors.primary : podiumBorderColor + '40',
            },
          ]}
        >
          <View style={styles.row}>
            <Text style={[styles.rankTop, { color: colors.textPrimary }]}>
              {medal}
            </Text>
            <Avatar nickname={entry.nickname ?? '?'} avatarEmoji={entry.avatarEmoji} size="sm" />
            <View style={styles.nameColumn}>
              <Text
                style={[
                  styles.nickname,
                  { color: isCurrentUser ? colors.primary : colors.textPrimary },
                ]}
                numberOfLines={1}
              >
                {entry.nickname ?? '???'}
              </Text>
              {mode === 'streak' && (entry.currentStreak ?? 0) > 0 && (
                <Text style={[styles.subValue, { color: colors.textTertiary }]}>
                  {t('leaderboard.streakCurrent', { count: entry.currentStreak })}
                </Text>
              )}
            </View>
            <Text style={[styles.scoreTop, { color: colors.textPrimary }]}>
              {displayValue}
            </Text>
          </View>
        </LinearGradient>
      </View>
    );
  }

  return (
    <Card
      variant={isCurrentUser ? 'highlighted' : 'flat'}
      highlightColor={colors.primary}
      style={styles.card}
    >
      <View style={styles.row}>
        <Text style={[styles.rank, { color: colors.textSecondary }]}>
          {rank > 0 ? `#${rank}` : '—'}
        </Text>
        <Avatar nickname={entry.nickname ?? '?'} avatarEmoji={entry.avatarEmoji} size="sm" />
        <View style={styles.nameColumn}>
          <Text
            style={[
              styles.nickname,
              { color: isCurrentUser ? colors.primary : colors.textPrimary },
            ]}
            numberOfLines={1}
          >
            {entry.nickname ?? '???'}
          </Text>
          {mode === 'streak' && entry.bestStreak != null && entry.bestStreak > (entry.currentStreak ?? 0) && (
            <Text style={[styles.subValue, { color: colors.textTertiary }]}>
              best: {entry.bestStreak}d
            </Text>
          )}
        </View>
        <Text style={[styles.score, { color: colors.textPrimary }]}>
          {displayValue}
        </Text>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  topCard: {
    marginBottom: 8,
  },
  topCardInner: {
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  card: {
    marginBottom: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rankTop: {
    width: 32,
    fontSize: 20,
    textAlign: 'center',
  },
  rank: {
    width: 32,
    fontSize: 14,
    fontFamily: fontFamily.bold,
    textAlign: 'center',
  },
  nameColumn: {
    flex: 1,
  },
  nickname: {
    fontSize: 16,
    fontFamily: fontFamily.bold,
  },
  subValue: {
    fontSize: 12,
    fontFamily: fontFamily.regular,
    marginTop: 1,
  },
  scoreTop: {
    fontSize: 20,
    fontFamily: fontFamily.extraBold,
    letterSpacing: -0.3,
  },
  score: {
    fontSize: 17,
    fontFamily: fontFamily.extraBold,
  },
});
