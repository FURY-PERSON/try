import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { useThemeContext } from '@/theme';
import { fontFamily } from '@/theme/typography';
import type { LeaderboardEntry as LeaderboardEntryType } from '@/shared';
import type { FC } from 'react';

type LeaderboardEntryProps = {
  entry: LeaderboardEntryType;
  rank: number;
  isCurrentUser?: boolean;
};

const MEDAL_EMOJI: Record<number, string> = {
  1: '\u{1F947}',
  2: '\u{1F948}',
  3: '\u{1F949}',
};

export const LeaderboardEntry: FC<LeaderboardEntryProps> = ({
  entry,
  rank,
  isCurrentUser = false,
}) => {
  const { colors, gradients, elevation, borderRadius } = useThemeContext();
  const isTop3 = rank <= 3;
  const medal = MEDAL_EMOJI[rank];

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
          colors={podiumGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.topCardInner,
            {
              borderRadius: borderRadius.xl,
              borderWidth: 1.5,
              borderColor: podiumBorderColor + '40',
            },
          ]}
        >
          <View style={styles.row}>
            <Text style={[styles.rankTop, { color: colors.textPrimary }]}>
              {medal}
            </Text>
            <Avatar nickname={entry.nickname ?? '?'} avatarEmoji={entry.avatarEmoji} size="sm" />
            <Text
              style={[
                styles.nickname,
                { color: isCurrentUser ? colors.primary : colors.textPrimary },
              ]}
              numberOfLines={1}
            >
              {entry.nickname ?? '???'}
            </Text>
            <Text style={[styles.scoreTop, { color: colors.textPrimary }]}>
              {entry.correctAnswers}
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
          #{rank}
        </Text>
        <Avatar nickname={entry.nickname ?? '?'} avatarEmoji={entry.avatarEmoji} size="sm" />
        <Text
          style={[
            styles.nickname,
            { color: isCurrentUser ? colors.primary : colors.textPrimary },
          ]}
          numberOfLines={1}
        >
          {entry.nickname ?? '???'}
        </Text>
        <Text style={[styles.score, { color: colors.textPrimary }]}>
          {entry.correctAnswers}
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
  nickname: {
    flex: 1,
    fontSize: 16,
    fontFamily: fontFamily.bold,
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
