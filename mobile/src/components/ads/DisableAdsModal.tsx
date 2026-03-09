import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { OverlayModal } from '@/components/feedback/OverlayModal';
import { useThemeContext } from '@/theme';
import { useTranslation } from 'react-i18next';
import { useRewardedAd } from './RewardedAdManager';
import { useFeatureFlagPayload } from '@/features/feature-flags/hooks/useFeatureFlag';
import { adManager } from '@/services/ads';
import { useAdsStore } from '@/stores/useAdsStore';
import { fontFamily } from '@/theme/typography';
import type { FC } from 'react';

type DisableAdsModalProps = {
  visible: boolean;
  onClose: () => void;
};

export const DisableAdsModal: FC<DisableAdsModalProps> = ({ visible, onClose }) => {
  const { colors } = useThemeContext();
  const { t } = useTranslation();
  const { showForReward, isReady, getAdNetwork } = useRewardedAd();
  const triggerAdIconOnboarding = useAdsStore((s) => s.triggerAdIconOnboarding);

  const payload = useFeatureFlagPayload<{
    adFreeMinutes?: number;
    requiredViews?: number;
    yandex_requiredViews?: number;
    unity_requiredViews?: number;
  }>('ad_rewarded_video');
  const minutes = payload?.adFreeMinutes ?? 30;

  const getRequiredViews = useCallback(() => {
    const network = getAdNetwork().toLowerCase();
    if (network.includes('yandex') && payload?.yandex_requiredViews != null) {
      return payload.yandex_requiredViews;
    }
    if (network.includes('unity') && payload?.unity_requiredViews != null) {
      return payload.unity_requiredViews;
    }
    return payload?.requiredViews ?? 2;
  }, [payload, getAdNetwork]);
  const [watchedCount, setWatchedCount] = useState(0);

  // Reset counter when modal opens
  useEffect(() => {
    if (visible) setWatchedCount(0);
  }, [visible]);

  const [completedAllVideos, setCompletedAllVideos] = useState(false);

  const handleWatch = async () => {
    const shown = await showForReward();
    if (shown) {
      const newCount = watchedCount + 1;
      setWatchedCount(newCount);
      if (newCount >= getRequiredViews()) {
        setCompletedAllVideos(true);
        adManager.activateAdFree();
        onClose();
      }
    }
  };

  const handleClose = useCallback(() => {
    if (!completedAllVideos) {
      triggerAdIconOnboarding();
    }
    onClose();
  }, [completedAllVideos, triggerAdIconOnboarding, onClose]);

  // Reset completedAllVideos when modal opens
  useEffect(() => {
    if (visible) setCompletedAllVideos(false);
  }, [visible]);

  return (
    <OverlayModal visible={visible} onClose={handleClose}>
      <View style={[styles.modal, { backgroundColor: colors.surface, borderRadius: 20 }]}>
        <Pressable onPress={handleWatch} disabled={!isReady}>
          <MaterialCommunityIcons name="television-play" size={48} color={isReady ? colors.gold : colors.textTertiary} />
        </Pressable>
        <Text style={[styles.title, { color: colors.textPrimary }]}>
          {t('ads.disableTitle')}
        </Text>
        <Text style={[styles.desc, { color: colors.textSecondary }]}>
          {t('ads.disableDesc', { minutes })}
        </Text>
        <Pressable
          onPress={handleWatch}
          disabled={!isReady}
          style={[
            styles.watchBtn,
            { backgroundColor: isReady ? colors.primary : colors.surfaceVariant },
          ]}
        >
          <Text style={[styles.watchBtnText, { color: isReady ? '#FFFFFF' : colors.textTertiary }]}>
            {isReady
              ? `${t('ads.watchVideo')} (${watchedCount}/${getRequiredViews()})`
              : t('common.loading')}
          </Text>
        </Pressable>
        <Pressable onPress={handleClose} style={styles.cancelBtn}>
          <Text style={[styles.cancelText, { color: colors.textSecondary }]}>
            {t('common.close')}
          </Text>
        </Pressable>
      </View>
    </OverlayModal>
  );
};

const styles = StyleSheet.create({
  modal: {
    width: '100%',
    padding: 24,
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 20,
    fontFamily: fontFamily.bold,
    textAlign: 'center',
  },
  desc: {
    fontSize: 15,
    fontFamily: fontFamily.regular,
    textAlign: 'center',
    lineHeight: 22,
  },
  watchBtn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  watchBtnText: {
    fontSize: 16,
    fontFamily: fontFamily.semiBold,
  },
  cancelBtn: {
    paddingVertical: 8,
  },
  cancelText: {
    fontSize: 14,
    fontFamily: fontFamily.regular,
  },
});
