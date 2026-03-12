import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { LeaderboardEntry } from './LeaderboardEntry';
import { AdBanner } from '@/components/ads/AdBanner';
import { useFloatingTabBarHeight } from '@/components/navigation/FloatingTabBar';
import { useThemeContext } from '@/theme';
import { fontFamily } from '@/theme/typography';
import type { LeaderboardEntry as LeaderboardEntryType, LeaderboardMode } from '@/shared';
import type { FC } from 'react';
import { s } from '@/utils/scale';

type LeaderboardListProps = {
  data: LeaderboardEntryType[];
  currentUserId?: string;
  mode?: LeaderboardMode;
  userContext?: LeaderboardEntryType[];
  positionLabel?: string | null;
  refreshing?: boolean;
  onRefresh?: () => void;
};

export const LeaderboardList: FC<LeaderboardListProps> = ({ data, currentUserId, mode = 'score', userContext, positionLabel, refreshing, onRefresh }) => {
  const { colors, borderRadius } = useThemeContext();
  const tabBarHeight = useFloatingTabBarHeight();

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
      <View style={styles.adFooter}>
        <AdBanner placement="leaderboard" size="MEDIUM_RECTANGLE" />
      </View>
    </View>
  );

  return (
    <FlashList
      data={data}
      keyExtractor={(item) => item.userId}
      estimatedItemSize={64}
      renderItem={({ item, index }) => (
        <LeaderboardEntry
          entry={item}
          rank={index + 1}
          isCurrentUser={item.userId === currentUserId}
          mode={mode}
        />
      )}
      ListFooterComponent={footer}
      contentContainerStyle={{ paddingBottom: tabBarHeight + 16 }}
      showsVerticalScrollIndicator={false}
      refreshing={refreshing}
      onRefresh={onRefresh}
    />
  );
};

const styles = StyleSheet.create({
  contextBlock: {
    marginTop: s(8),
  },
  separator: {
    textAlign: 'center',
    fontSize: s(20),
    fontFamily: fontFamily.bold,
    marginBottom: s(8),
    letterSpacing: 4,
  },
  positionFooter: {
    paddingVertical: s(14),
    paddingHorizontal: s(20),
    alignItems: 'center',
    marginTop: s(8),
  },
  positionText: {
    fontSize: s(15),
    fontFamily: fontFamily.semiBold,
  },
  adFooter: {
    marginTop: s(16),
  },
});
