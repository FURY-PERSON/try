import React, { useMemo, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useThemeContext } from '@/theme';
import { fontFamily } from '@/theme/typography';
import { useTranslation } from 'react-i18next';
import type { FC } from 'react';

type HeatmapCalendarProps = {
  activityMap: Record<string, number>;
};

const WEEKS = 52;
const CELL_SIZE = 14;
const CELL_GAP = 3;
const STEP = CELL_SIZE + CELL_GAP;
const LABEL_COLUMN_WIDTH = 28;

// Indigo-based palette (Midnight Scholar)
const LIGHT_COLORS = ['#F1F5F9', '#C7D2FE', '#A5B4FC', '#818CF8', '#6366F1'];
const DARK_COLORS = ['#2A3349', '#312E81', '#4338CA', '#6366F1', '#818CF8'];

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
    const todayDay = today.getDay();
    const todayDayMon = todayDay === 0 ? 6 : todayDay - 1;

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
        const isFuture = date > today;

        week.push({
          date: key,
          count: isFuture ? -1 : (activityMap[key] ?? 0),
        });

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

  const gridWidth = WEEKS * STEP;

  return (
    <View>
      <View style={{ flexDirection: 'row' }}>
        {/* Day labels column */}
        <View style={{ width: LABEL_COLUMN_WIDTH, marginTop: 20 }}>
          {dayLabels.map((label, i) => (
            <Text
              key={label}
              style={[
                styles.dayLabel,
                {
                  color: colors.textSecondary,
                  top: [0, 2, 4][i] * STEP,
                  lineHeight: CELL_SIZE,
                },
              ]}
            >
              {label}
            </Text>
          ))}
        </View>

        {/* Scrollable grid */}
        <ScrollView
          ref={scrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          onContentSizeChange={() => {
            scrollRef.current?.scrollToEnd({ animated: false });
          }}
        >
          <View>
            {/* Month labels */}
            <View style={[styles.monthRow, { width: gridWidth }]}>
              {monthLabels.map((ml, i) => (
                <Text
                  key={`${ml.label}-${i}`}
                  style={[
                    styles.monthLabel,
                    {
                      color: colors.textSecondary,
                      left: ml.weekIndex * STEP,
                    },
                  ]}
                >
                  {ml.label}
                </Text>
              ))}
            </View>

            {/* Grid cells */}
            <View style={[styles.grid, { width: gridWidth, gap: CELL_GAP }]}>
              {grid.map((week, weekIndex) => (
                <View key={weekIndex} style={{ gap: CELL_GAP }}>
                  {week.map((day) => (
                    <View
                      key={day.date}
                      style={{
                        width: CELL_SIZE,
                        height: CELL_SIZE,
                        backgroundColor:
                          day.count < 0
                            ? 'transparent'
                            : levelColors[getLevel(day.count)],
                        borderRadius: 2,
                      }}
                    />
                  ))}
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
      </View>

      <View style={styles.legend}>
        <Text style={[styles.legendText, { color: colors.textSecondary }]}>
          {t('profile.activityLess')}
        </Text>
        {levelColors.map((color, i) => (
          <View
            key={i}
            style={[styles.legendCell, { backgroundColor: color, borderRadius: 2 }]}
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
    height: 18,
    marginBottom: 2,
    position: 'relative',
  },
  monthLabel: {
    fontSize: 11,
    fontFamily: fontFamily.regular,
    position: 'absolute',
    top: 0,
  },
  grid: {
    flexDirection: 'row',
  },
  dayLabel: {
    fontSize: 10,
    fontFamily: fontFamily.regular,
    position: 'absolute',
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
    fontFamily: fontFamily.regular,
    marginHorizontal: 2,
  },
  legendCell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
  },
});
