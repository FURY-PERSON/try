import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useThemeContext } from '@/theme';
import type { FC } from 'react';

type HeatmapCalendarProps = {
  activityMap: Record<string, boolean>;
  weeks?: number;
};

const DAY_LABELS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

export const HeatmapCalendar: FC<HeatmapCalendarProps> = ({
  activityMap,
  weeks = 12,
}) => {
  const { colors, borderRadius } = useThemeContext();

  const grid = useMemo(() => {
    const today = new Date();
    const cells: { date: string; active: boolean }[][] = [];

    for (let w = weeks - 1; w >= 0; w--) {
      const week: { date: string; active: boolean }[] = [];
      for (let d = 0; d < 7; d++) {
        const date = new Date(today);
        date.setDate(date.getDate() - w * 7 - (6 - d));
        const key = date.toISOString().split('T')[0] ?? '';
        week.push({
          date: key,
          active: activityMap[key] ?? false,
        });
      }
      cells.push(week);
    }

    return cells;
  }, [activityMap, weeks]);

  return (
    <View style={styles.container}>
      <View style={styles.dayLabels}>
        {DAY_LABELS.map((label) => (
          <Text key={label} style={[styles.dayLabel, { color: colors.textSecondary }]}>
            {label}
          </Text>
        ))}
      </View>
      <View style={styles.grid}>
        {grid.map((week, weekIndex) => (
          <View key={weekIndex} style={styles.weekColumn}>
            {week.map((day) => (
              <View
                key={day.date}
                style={[
                  styles.cell,
                  {
                    backgroundColor: day.active ? colors.primary : colors.surfaceVariant,
                    borderRadius: borderRadius.sm / 2,
                  },
                ]}
              />
            ))}
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
  },
  dayLabels: {
    marginRight: 4,
    justifyContent: 'space-between',
  },
  dayLabel: {
    fontSize: 9,
    fontFamily: 'Nunito_600SemiBold',
    height: 14,
    lineHeight: 14,
  },
  grid: {
    flex: 1,
    flexDirection: 'row',
    gap: 2,
  },
  weekColumn: {
    gap: 2,
    flex: 1,
  },
  cell: {
    aspectRatio: 1,
    width: '100%',
  },
});
