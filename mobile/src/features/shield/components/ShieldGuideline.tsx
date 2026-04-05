import React, { useState, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { OverlayModal } from '@/components/feedback/OverlayModal';
import { useThemeContext } from '@/theme';
import { useTranslation } from 'react-i18next';
import { fontFamily } from '@/theme/typography';
import { s } from '@/utils/scale';
import type { FC } from 'react';

type ShieldGuidelineProps = {
  visible: boolean;
  onClose: () => void;
};

export const ShieldGuideline: FC<ShieldGuidelineProps> = ({
  visible,
  onClose,
}) => {
  const { colors } = useThemeContext();
  const { t } = useTranslation();
  const [step, setStep] = useState<1 | 2>(1);

  const handleNext = useCallback(() => {
    if (step === 1) {
      setStep(2);
    } else {
      setStep(1); // Reset for next time
      onClose();
    }
  }, [step, onClose]);

  const handleClose = useCallback(() => {
    setStep(1);
    onClose();
  }, [onClose]);

  return (
    <OverlayModal visible={visible} onClose={handleClose}>
      <View style={[styles.modal, { backgroundColor: colors.surface, borderRadius: 20 }]}>
        {step === 1 ? (
          <>
            <MaterialCommunityIcons
              name="fire"
              size={48}
              color="#F97316"
            />
            <Text style={[styles.title, { color: colors.textPrimary }]}>
              {t('shield.streakGuideTitle')}
            </Text>
            <Text style={[styles.desc, { color: colors.textSecondary }]}>
              {t('shield.streakGuideDesc')}
            </Text>
          </>
        ) : (
          <>
            <MaterialCommunityIcons
              name="shield-outline"
              size={48}
              color="#3B82F6"
            />
            <Text style={[styles.title, { color: colors.textPrimary }]}>
              {t('shield.shieldGuideTitle')}
            </Text>
            <Text style={[styles.desc, { color: colors.textSecondary }]}>
              {t('shield.shieldGuideDesc')}
            </Text>
          </>
        )}
        <Pressable
          onPress={handleNext}
          style={[styles.button, { backgroundColor: colors.primary }]}
        >
          <Text style={styles.buttonText}>
            {step === 1 ? t('common.next') : t('shield.got')}
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
  button: {
    width: '100%',
    paddingVertical: s(14),
    borderRadius: s(12),
    alignItems: 'center',
    marginTop: s(8),
  },
  buttonText: {
    fontSize: s(16),
    fontFamily: fontFamily.semiBold,
    color: '#FFFFFF',
  },
});
