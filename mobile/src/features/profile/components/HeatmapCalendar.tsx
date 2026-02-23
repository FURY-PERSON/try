import React, { useMemo, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useThemeContext } from '@/theme';
import { useTranslation } from 'react-i18next';
import type { FC } from 'react';

type HeatmapCalendarProps = {
  activityMap: Record<string, number>;
};

const WEEKS = 52;
const CELL_SIZE = 12;
const CELL_GAP = 2;

const LIGHT_COLORS = ['#ebedf0', '#9be9a8', '#40c463', '#30a14e', '#216e39'];
const DARK_COLORS = ['#161b22', '#0e4429', '#006d32', '#26a641', '#39d353'];

const MONTHS_RU = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];
const MONTHS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const DAY_LABELS_RU = ['Пн', 'Ср', 'Пт'];
const DAY_LABELS_EN = ['Mon', 'Wed', 'Fri'];

function getLevel(count: number): 0 | 1 | 2 | 3 | 4 {
  if (count === 0) return 0;
  if (count === 1) return 1;
  if (count <= 3) return 2;
  if (count <= 5) return 3;
  return 4;
}

export const HeatmapCalendar: FC<HeatmapCalendarProps> = ({ activityMap }) => {
  const { colors, isDark } = useThemeContext();
  const { i18n, t } = useTranslation();
  const scrollRef = useRef<ScrollView>(null);
  const isRu = i18n.language === 'ru';

  const levelColors = isDark ? DARK_COLORS : LIGHT_COLORS;
  const monthNames = isRu ? MONTHS_RU : MONTHS_EN;
  const dayLabels = isRu ? DAY_LABELS_RU : DAY_LABELS_EN;

  const { grid, monthLabels } = useMemo(() => {
    const today = new Date();
    const todayDay = today.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
    // Adjust so Monday=0
    const todayDayMon = todayDay === 0 ? 6 : todayDay - 1;

    // Start from the Monday of (WEEKS-1) weeks ago relative to the current week's Monday
    const currentMonday = new Date(today);
    currentMonday.setDate(currentMonday.getDate() - todayDayMon);

    const startDate = new Date(currentMonday);
    startDate.setDate(startDate.getDate() - (WEEKS - 1) * 7);

    const cells: { date: string; count: number }[][] = [];
    const labels: { weekIndex: number; label: string }[] = [];
    let lastMonth = -1;

    for (let w = 0; w < WEEKS; w++) {
      const week: { date: string; count: number }[] = [];

      for (let d = 0; d < 7; d++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + w * 7 + d);
        const key = date.toISOString().split('T')[0] ?? '';

        // Check if this is a future date
        const isFuture = date > today;

        week.push({
          date: key,
          count: isFuture ? -1 : (activityMap[key] ?? 0),
        });

        // Track month labels: show label at the first Monday of each new month
        if (d === 0) {
          const month = date.getMonth();
          if (month !== lastMonth) {
            labels.push({ weekIndex: w, label: monthNames[month] });
            lastMonth = month;
          }
        }
      }

      cells.push(week);
    }

    return { grid: cells, monthLabels: labels };
  }, [activityMap, monthNames]);

  const gridWidth = WEEKS * (CELL_SIZE + CELL_GAP);
  const labelColumnWidth = 28;

  return (
    <View>
      {/* Month labels row */}
      <View style={{ flexDirection: 'row' }}>
        <View style={{ width: labelColumnWidth }} />
        <ScrollView
          ref={scrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          onContentSizeChange={() =>
            scrollRef.current?.scrollToEnd({ animated: false })
          }
        >
          {/* Month labels */}
          <View style={[styles.monthRow, { width: gridWidth }]}>
            {monthLabels.map((ml, i) => (
              <Text
                key={`${ml.label}-${i}`}
                style={[
                  styles.monthLabel,
                  {
                    color: colors.textSecondary,
                    left: ml.weekIndex * (CELL_SIZE + CELL_GAP),
                  },
                ]}
              >
                {ml.label}
              </Text>
            ))}
          </View>

          {/* Grid */}
          <View style={[styles.grid, { width: gridWidth }]}>
            {grid.map((week, weekIndex) => (
              <View key={weekIndex} style={styles.weekColumn}>
                {week.map((day) => (
                  <View
                    key={day.date}
                    style={[
                      styles.cell,
                      {
                        backgroundColor:
                          day.count < 0
                            ? 'transparent'
                            : levelColors[getLevel(day.count)],
                      },
                    ]}
                  />
                ))}
              </View>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Day labels overlay — positioned over the grid */}
      <View style={[styles.dayLabelsOverlay, { top: 16, left: 0, width: labelColumnWidth }]}>
        {dayLabels.map((label, i) => (
          <Text
            key={label}
            style={[
              styles.dayLabel,
              {
                color: colors.textSecondary,
                top: [0, 2, 4][i] * (CELL_SIZE + CELL_GAP),
              },
            ]}
          >
            {label}
          </Text>
        ))}
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <Text style={[styles.legendText, { color: colors.textSecondary }]}>
          {t('profile.activityLess')}
        </Text>
        {levelColors.map((color, i) => (
          <View
            key={i}
            style={[styles.legendCell, { backgroundColor: color }]}
          />
        ))}
        <Text style={[styles.legendText, { color: colors.textSecondary }]}>
          {t('profile.activityMore')}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  monthRow: {
    height: 14,
    marginBottom: 2,
    position: 'relative',
  },
  monthLabel: {
    fontSize: 9,
    fontFamily: 'Nunito_400Regular',
    position: 'absolute',
    top: 0,
  },
  grid: {
    flexDirection: 'row',
    gap: CELL_GAP,
  },
  weekColumn: {
    gap: CELL_GAP,
  },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    borderRadius: 2,
  },
  dayLabelsOverlay: {
    position: 'absolute',
  },
  dayLabel: {
    fontSize: 9,
    fontFamily: 'Nunito_400Regular',
    position: 'absolute',
    lineHeight: CELL_SIZE,
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 8,
    gap: 3,
  },
  legendText: {
    fontSize: 10,
    fontFamily: 'Nunito_400Regular',
    marginHorizontal: 2,
  },
  legendCell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    borderRadius: 2,
  },
});
