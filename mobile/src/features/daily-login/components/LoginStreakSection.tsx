import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/feedback/Skeleton';
import { useThemeContext } from '@/theme';
import { fontFamily } from '@/theme/typography';
import { useDailyLoginStatus } from '../hooks/useDailyLoginStatus';
import { ProgressionStrip } from './ProgressionStrip';
import { s } from '@/utils/scale';

export function LoginStreakSection() {
  const { colors, spacing } = useThemeContext();
  const { t } = useTranslation();
  const { data, isLoading } = useDailyLoginStatus();

  if (!isLoading && (!data || !data.isEnabled)) {
    return null;
  }

  return (
    <View>
      <Text style={[styles.overline, { color: colors.primary }]}>
        {t('profile.dailyBonus.sectionTitle').toUpperCase()}
      </Text>

      <Card variant="default" style={{ marginTop: spacing.md, padding: 0 }}>
        {isLoading || !data ? (
          <View style={{ padding: s(16) }}>
            <Skeleton width="100%" height={120} shape="rectangle" />
          </View>
        ) : (
          <>
            <Row
              label={t('profile.dailyBonus.currentStreak')}
              value={t('profile.dailyBonus.daysInRow', { count: data.loginStreak })}
              colors={colors}
              isFirst
            />
            <Row
              label={t('profile.dailyBonus.best')}
              value={t('profile.dailyBonus.daysInRow', { count: data.bestLoginStreak })}
              colors={colors}
            />
          </>
        )}
      </Card>

      {!isLoading && data && data.progression.length > 0 && (
        <View style={{ marginTop: spacing.lg }}>
          <ProgressionStrip status={data} />
        </View>
      )}
    </View>
  );
}

type RowProps = {
  label: string;
  value: string;
  colors: Record<string, string>;
  isFirst?: boolean;
};

function Row({ label, value, colors, isFirst }: RowProps) {
  return (
    <View
      style={[
        styles.row,
        !isFirst && {
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: colors.separator,
        },
      ]}
    >
      <Text style={[styles.rowLabel, { color: colors.textSecondary }]}>{label}</Text>
      <Text style={[styles.rowValue, { color: colors.textPrimary }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  overline: {
    fontSize: s(11),
    fontFamily: fontFamily.bold,
    letterSpacing: 1.5,
    marginBottom: s(4),
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: s(14),
    paddingHorizontal: s(16),
    minHeight: s(48),
  },
  rowLabel: {
    fontSize: s(14),
    fontFamily: fontFamily.regular,
    flexShrink: 1,
  },
  rowValue: {
    fontSize: s(14),
    fontFamily: fontFamily.semiBold,
  },
});
