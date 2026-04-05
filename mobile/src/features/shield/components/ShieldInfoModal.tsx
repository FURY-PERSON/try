import React, { useCallback } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { OverlayModal } from '@/components/feedback/OverlayModal';
import { useRewardedAd } from '@/components/ads/RewardedAdManager';
import { useThemeContext } from '@/theme';
import { useTranslation } from 'react-i18next';
import { fontFamily } from '@/theme/typography';
import { shieldsApi } from '../api/shieldsApi';
import { showToast } from '@/stores/useToastStore';
import { s } from '@/utils/scale';
import type { FC } from 'react';

type ShieldInfoModalProps = {
  visible: boolean;
  onClose: () => void;
  shieldCount: number;
  onShieldsEarned: (total: number) => void;
};

export const ShieldInfoModal: FC<ShieldInfoModalProps> = ({
  visible,
  onClose,
  shieldCount,
  onShieldsEarned,
}) => {
  const { colors } = useThemeContext();
  const { t } = useTranslation();
  const { showForReward, isReady } = useRewardedAd();

  const handleWatch = useCallback(async () => {
    const shown = isReady ? await showForReward() : __DEV__;
    if (shown) {
      try {
        const result = await shieldsApi.rewardShield();
        onShieldsEarned(result.totalShields);
        showToast(t('shield.earned', { count: result.shieldsAdded }), 'success');
      } catch {
        showToast(t('error.generic'));
      }
    }
  }, [showForReward, isReady, onShieldsEarned, t]);

  return (
    <OverlayModal visible={visible} onClose={onClose}>
      <View style={[styles.modal, { backgroundColor: colors.surface, borderRadius: 20 }]}>
        <MaterialCommunityIcons
          name="shield-outline"
          size={48}
          color="#3B82F6"
        />
        <Text style={[styles.title, { color: colors.textPrimary }]}>
          {t('shield.title')} ({shieldCount})
        </Text>
        <Text style={[styles.desc, { color: colors.textSecondary }]}>
          {t('shield.description')}
        </Text>
        <Pressable
          onPress={handleWatch}
          disabled={!isReady && !__DEV__}
          style={[
            styles.watchBtn,
            { backgroundColor: (isReady || __DEV__) ? colors.primary : colors.surfaceVariant },
          ]}
        >
          <MaterialCommunityIcons
            name="shield-plus-outline"
            size={20}
            color={(isReady || __DEV__) ? '#FFFFFF' : colors.textTertiary}
          />
          <Text style={[styles.watchBtnText, { color: (isReady || __DEV__) ? '#FFFFFF' : colors.textTertiary }]}>
            {t('shield.watchVideo')}
          </Text>
        </Pressable>
        <Pressable onPress={onClose} style={styles.cancelBtn}>
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
    padding: s(24),
    alignItems: 'center',
    gap: s(12),
  },
  title: {
    fontSize: s(20),
    fontFamily: fontFamily.bold,
    textAlign: 'center',
  },
  desc: {
    fontSize: s(15),
    fontFamily: fontFamily.regular,
    textAlign: 'center',
    lineHeight: s(22),
  },
  watchBtn: {
    flexDirection: 'row',
    width: '100%',
    paddingVertical: s(14),
    borderRadius: s(12),
    alignItems: 'center',
    justifyContent: 'center',
    gap: s(8),
    marginTop: s(8),
  },
  watchBtnText: {
    fontSize: s(16),
    fontFamily: fontFamily.semiBold,
  },
  cancelBtn: {
    paddingVertical: s(8),
  },
  cancelText: {
    fontSize: s(14),
    fontFamily: fontFamily.regular,
  },
});
