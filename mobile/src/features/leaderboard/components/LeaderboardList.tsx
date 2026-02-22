import React from 'react';
import { FlatList, StyleSheet } from 'react-native';
import { LeaderboardEntry } from './LeaderboardEntry';
import type { LeaderboardEntry as LeaderboardEntryType } from '@/shared';
import type { FC } from 'react';

type LeaderboardListProps = {
  data: LeaderboardEntryType[];
  currentUserId?: string;
};

export const LeaderboardList: FC<LeaderboardListProps> = ({ data, currentUserId }) => {
  return (
    <FlatList
      data={data}
      keyExtractor={(item) => item.userId}
      renderItem={({ item, index }) => (
        <LeaderboardEntry
          entry={item}
          rank={index + 1}
          isCurrentUser={item.userId === currentUserId}
        />
      )}
      contentContainerStyle={styles.list}
      showsVerticalScrollIndicator={false}
    />
  );
};

const styles = StyleSheet.create({
  list: {
    paddingBottom: 100,
  },
});
