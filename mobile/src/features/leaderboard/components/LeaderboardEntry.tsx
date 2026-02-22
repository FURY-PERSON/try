import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { useThemeContext } from '@/theme';
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
  const { colors } = useThemeContext();
  const isTop3 = rank <= 3;
  const medal = MEDAL_EMOJI[rank];

  return (
    <Card
      variant={isTop3 ? 'highlighted' : isCurrentUser ? 'highlighted' : 'flat'}
      highlightColor={
        rank === 1 ? colors.gold : rank === 2 ? colors.border : rank === 3 ? colors.orange : colors.blue
      }
      style={styles.card}
    >
      <View style={styles.row}>
        <Text style={[styles.rank, { color: colors.textSecondary }]}>
          {medal ?? `#${rank}`}
        </Text>
        <Avatar nickname={entry.nickname ?? '?'} size="sm" />
        <Text
          style={[
            styles.nickname,
            { color: isCurrentUser ? colors.blue : colors.textPrimary },
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
  rank: {
    width: 32,
    fontSize: 15,
    fontFamily: 'Nunito_700Bold',
    textAlign: 'center',
  },
  nickname: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Nunito_700Bold',
  },
  score: {
    fontSize: 17,
    fontFamily: 'Nunito_800ExtraBold',
  },
});
