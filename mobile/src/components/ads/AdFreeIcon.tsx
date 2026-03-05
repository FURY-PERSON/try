import React, { useEffect, useState } from 'react';
import { Pressable, Text, StyleSheet, View } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useThemeContext } from '@/theme';
import { useAdsStore } from '@/stores/useAdsStore';
import { useFeatureFlag } from '@/features/feature-flags/hooks/useFeatureFlag';
import { fontFamily } from '@/theme/typography';
import type { FC } from 'react';

type AdFreeIconProps = {
  onPress: () => void;
};

export const AdFreeIcon: FC<AdFreeIconProps> = ({ onPress }) => {
  const { colors } = useThemeContext();
  const rewardedEnabled = useFeatureFlag('ad_rewarded_video', true);
  const adsEnabled = useFeatureFlag('ads_enable', true);
  const adFreeUntil = useAdsStore((s) => s.adFreeUntil);
  const isAdFree = adFreeUntil > Date.now();
  const [remaining, setRemaining] = useState('');

  useEffect(() => {
    if (!isAdFree) return;

    const update = () => {
      const ms = adFreeUntil - Date.now();
      if (ms <= 0) {
        setRemaining('');
        return;
      }
      const totalSeconds = Math.ceil(ms / 1000);
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      setRemaining(`${minutes}:${seconds.toString().padStart(2, '0')}`);
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [isAdFree, adFreeUntil]);

  if (!rewardedEnabled || !adsEnabled) return null;

  if (isAdFree) {
    return (
      <View style={styles.container}>
        <View style={[styles.timerBadge, { backgroundColor: colors.emerald + '15' }]}>
          <MaterialCommunityIcons name="timer-outline" size={16} color={colors.emerald} />
          <Text style={[styles.timerText, { color: colors.emerald }]}>{remaining}</Text>
        </View>
      </View>
    );
  }

  return (
    <Pressable onPress={onPress} hitSlop={8} style={styles.container}>
      <View style={[styles.iconBadge, { backgroundColor: colors.gold + '15' }]}>
        <MaterialCommunityIcons name="television-play" size={18} color={colors.gold} />
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    marginRight: 8,
  },
  iconBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  timerText: {
    fontSize: 12,
    fontFamily: fontFamily.semiBold,
  },
});
