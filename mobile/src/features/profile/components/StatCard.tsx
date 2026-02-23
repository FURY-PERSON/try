import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card } from '@/components/ui/Card';
import { useThemeContext } from '@/theme';
import type { FC, ReactNode } from 'react';

type StatCardProps = {
  icon: ReactNode;
  value: string | number;
  label: string;
};

export const StatCard: FC<StatCardProps> = ({ icon, value, label }) => {
  const { colors } = useThemeContext();

  return (
    <Card variant="flat" style={styles.card}>
      <View style={styles.content}>
        {icon}
        <Text style={[styles.value, { color: colors.textPrimary }]}>{value}</Text>
        <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  content: {
    alignItems: 'center',
    gap: 4,
  },
  value: {
    fontSize: 22,
    fontFamily: 'Nunito_700Bold',
  },
  label: {
    fontSize: 11,
    fontFamily: 'Nunito_500Medium',
  },
});
