import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card } from '@/components/ui/Card';
import { useThemeContext } from '@/theme';
import { fontFamily } from '@/theme/typography';
import type { FC, ReactNode } from 'react';
import { s } from '@/utils/scale';

type StatCardProps = {
  icon: ReactNode;
  value: string | number;
  label: string;
  accentColor?: string;
};

export const StatCard: FC<StatCardProps> = ({ icon, value, label, accentColor }) => {
  const { colors } = useThemeContext();
  const accent = accentColor ?? colors.primary;

  return (
    <Card variant="default" style={styles.card}>
      <View style={styles.content}>
        <View style={[styles.iconWrap, { backgroundColor: accent + '15' }]}>
          {icon}
        </View>
        <Text style={[styles.value, { color: colors.textPrimary }]}>{value}</Text>
        <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    paddingVertical: s(16),
    paddingHorizontal: s(12),
  },
  content: {
    alignItems: 'center',
    gap: s(6),
  },
  iconWrap: {
    width: s(40),
    height: s(40),
    borderRadius: s(12),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: s(4),
  },
  value: {
    fontSize: s(24),
    fontFamily: fontFamily.bold,
    letterSpacing: -0.3,
  },
  label: {
    fontSize: s(11),
    fontFamily: fontFamily.medium,
  },
});
