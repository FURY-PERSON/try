import React, { useCallback } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useThemeContext } from '@/theme';
import { fontFamily } from '@/theme/typography';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { shareFactOfDay } from '@/utils/share';
import { analytics } from '@/services/analytics';
import { s } from '@/utils/scale';
import type { FactOfDay } from '../types';
import type { FC } from 'react';

type FactOfDayCardProps = {
  factOfDay: FactOfDay;
};

export const FactOfDayCard: FC<FactOfDayCardProps> = React.memo(({ factOfDay }) => {
  const { colors } = useThemeContext();
  const { t } = useTranslation();
  const language = useSettingsStore((s) => s.language);

  const statement = language === 'en' && factOfDay.statementEn
    ? factOfDay.statementEn
    : factOfDay.statement;

  const handleShare = useCallback(() => {
    shareFactOfDay({
      statement,
      userCorrect: factOfDay.userCorrect,
      wrongPercent: factOfDay.wrongPercent,
    });
    analytics.logEvent('share_fact_of_day');
  }, [statement, factOfDay.userCorrect, factOfDay.wrongPercent]);

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.primary }]}>
          {t('factOfDay.title')}
        </Text>
      </View>

      <Text style={[styles.statement, { color: colors.textPrimary }]} numberOfLines={3}>
        &ldquo;{statement}&rdquo;
      </Text>

      <Text style={[styles.wrongPercent, { color: colors.orange }]}>
        {t('factOfDay.wrongPercent', { percent: factOfDay.wrongPercent })}
      </Text>

      <View style={[styles.userResult, {
        backgroundColor: factOfDay.userCorrect ? colors.emerald + '15' : colors.red + '15',
      }]}>
        <Feather
          name={factOfDay.userCorrect ? 'check-circle' : 'x-circle'}
          size={s(18)}
          color={factOfDay.userCorrect ? colors.emerald : colors.red}
        />
        <Text style={[styles.userResultText, {
          color: factOfDay.userCorrect ? colors.emerald : colors.red,
        }]}>
          {factOfDay.userCorrect ? t('factOfDay.youGotIt') : t('factOfDay.youMissed')}
        </Text>
      </View>

      <Pressable style={[styles.shareButton, { backgroundColor: colors.primary }]} onPress={handleShare}>
        <Feather name="share-2" size={s(16)} color={colors.textOnPrimary} />
        <Text style={[styles.shareText, { color: colors.textOnPrimary }]}>
          {t('factOfDay.share')}
        </Text>
      </Pressable>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    borderRadius: s(16),
    borderWidth: 1,
    padding: s(16),
    gap: s(12),
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(8),
  },
  title: {
    fontSize: s(16),
    fontFamily: fontFamily.bold,
  },
  statement: {
    fontSize: s(15),
    fontFamily: fontFamily.semiBold,
    lineHeight: s(22),
  },
  wrongPercent: {
    fontSize: s(15),
    fontFamily: fontFamily.bold,
  },
  userResult: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(8),
    paddingVertical: s(8),
    paddingHorizontal: s(12),
    borderRadius: s(10),
  },
  userResultText: {
    fontSize: s(14),
    fontFamily: fontFamily.semiBold,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: s(8),
    paddingVertical: s(10),
    borderRadius: s(10),
  },
  shareText: {
    fontSize: s(14),
    fontFamily: fontFamily.semiBold,
  },
});
