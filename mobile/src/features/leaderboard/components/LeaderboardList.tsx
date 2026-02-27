import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { LeaderboardEntry } from './LeaderboardEntry';
import { useThemeContext } from '@/theme';
import { fontFamily } from '@/theme/typography';
import type { LeaderboardEntry as LeaderboardEntryType, LeaderboardMode } from '@/shared';
import type { FC } from 'react';

type LeaderboardListProps = {
  data: LeaderboardEntryType[];
  currentUserId?: string;
  mode?: LeaderboardMode;
  userContext?: LeaderboardEntryType[];
  positionLabel?: string | null;
};

export const LeaderboardList: FC<LeaderboardListProps> = ({ data, currentUserId, mode = 'score', userContext, positionLabel }) => {
  const { colors, borderRadius } = useThemeContext();

  const footer = (
    <View>
      {userContext && userContext.length > 0 && (
        <View style={styles.contextBlock}>
          <Text style={[styles.separator, { color: colors.textTertiary }]}>···</Text>
          {userContext.map((entry) => (
            <LeaderboardEntry
              key={entry.userId}
              entry={entry}
              rank={entry.rank}
              isCurrentUser={entry.userId === currentUserId}
              mode={mode}
            />
          ))}
        </View>
      )}
      {positionLabel && (
        <View style={[styles.positionFooter, { backgroundColor: colors.primary + '10', borderRadius: borderRadius.lg }]}>
          <Text style={[styles.positionText, { color: colors.primary }]}>
            {positionLabel}
          </Text>
        </View>
      )}
    </View>
  );

  return (
    <FlatList
      data={data}
      keyExtractor={(item) => item.userId}
      renderItem={({ item, index }) => (
        <LeaderboardEntry
          entry={item}
          rank={index + 1}
          isCurrentUser={item.userId === currentUserId}
          mode={mode}
        />
      )}
      ListFooterComponent={footer}
      contentContainerStyle={styles.list}
      showsVerticalScrollIndicator={false}
    />
  );
};

const styles = StyleSheet.create({
  list: {
    paddingBottom: 16,
  },
  contextBlock: {
    marginTop: 8,
  },
  separator: {
    textAlign: 'center',
    fontSize: 20,
    fontFamily: fontFamily.bold,
    marginBottom: 8,
    letterSpacing: 4,
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
