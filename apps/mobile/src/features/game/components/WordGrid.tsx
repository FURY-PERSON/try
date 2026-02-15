import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useThemeContext } from '@/theme';
import { haptics } from '@/utils/haptics';
import type { FC } from 'react';

type WordGridProps = {
  grid: string[][];
  selectedCells: { row: number; col: number }[];
  foundWords: string[];
  onCellPress: (row: number, col: number) => void;
};

export const WordGrid: FC<WordGridProps> = ({
  grid,
  selectedCells,
  onCellPress,
}) => {
  const { colors, borderRadius } = useThemeContext();

  const isCellSelected = (row: number, col: number): boolean =>
    selectedCells.some((c) => c.row === row && c.col === col);

  return (
    <View style={styles.grid}>
      {grid.map((row, rowIndex) => (
        <View key={rowIndex} style={styles.row}>
          {row.map((letter, colIndex) => {
            const selected = isCellSelected(rowIndex, colIndex);
            return (
              <Pressable
                key={`${rowIndex}-${colIndex}`}
                onPress={() => {
                  haptics.light();
                  onCellPress(rowIndex, colIndex);
                }}
                accessibilityLabel={`Grid cell ${letter}`}
                accessibilityRole="button"
                style={[
                  styles.cell,
                  {
                    backgroundColor: selected ? colors.blue : colors.surface,
                    borderColor: selected ? colors.blueDark : colors.border,
                    borderRadius: borderRadius.sm,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.letter,
                    { color: selected ? '#FFFFFF' : colors.textPrimary },
                  ]}
                >
                  {letter.toUpperCase()}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  grid: {
    gap: 2,
    alignSelf: 'center',
  },
  row: {
    flexDirection: 'row',
    gap: 2,
  },
  cell: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  letter: {
    fontSize: 16,
    fontFamily: 'Nunito_700Bold',
  },
});
