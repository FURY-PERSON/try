import React, { useMemo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useThemeContext } from '@/theme';
import { haptics } from '@/utils/haptics';
import { useSettingsStore } from '@/stores/useSettingsStore';
import type { FC } from 'react';
import type { LetterTileState } from '../types';

type CustomKeyboardProps = {
  onKeyPress: (letter: string) => void;
  onDelete: () => void;
  onHint?: () => void;
  usedLetters?: Record<string, LetterTileState>;
  disabled?: boolean;
};

const RU_ROWS = [
  ['Й', 'Ц', 'У', 'К', 'Е', 'Н', 'Г', 'Ш', 'Щ', 'З', 'Х'],
  ['Ф', 'Ы', 'В', 'А', 'П', 'Р', 'О', 'Л', 'Д', 'Ж'],
  ['Я', 'Ч', 'С', 'М', 'И', 'Т', 'Ь', 'Б', 'Ю'],
];

const EN_ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['Z', 'X', 'C', 'V', 'B', 'N', 'M'],
];

export const CustomKeyboard: FC<CustomKeyboardProps> = ({
  onKeyPress,
  onDelete,
  onHint,
  usedLetters = {},
  disabled = false,
}) => {
  const { colors, borderRadius } = useThemeContext();
  const language = useSettingsStore((s) => s.language);
  const rows = useMemo(() => (language === 'en' ? EN_ROWS : RU_ROWS), [language]);

  const getKeyColor = (letter: string): { bg: string; text: string } => {
    const state = usedLetters[letter];
    if (!state) return { bg: colors.surfaceVariant, text: colors.textPrimary };
    switch (state) {
      case 'correct':
        return { bg: colors.primary, text: '#FFFFFF' };
      case 'misplaced':
        return { bg: colors.gold, text: '#FFFFFF' };
      case 'incorrect':
        return { bg: colors.borderDark, text: colors.textSecondary };
      default:
        return { bg: colors.surfaceVariant, text: colors.textPrimary };
    }
  };

  const handleKeyPress = (letter: string) => {
    if (disabled) return;
    haptics.light();
    onKeyPress(letter);
  };

  return (
    <View style={styles.keyboard}>
      {rows.map((row, rowIndex) => (
        <View key={rowIndex} style={styles.row}>
          {rowIndex === rows.length - 1 && onHint && (
            <Pressable
              onPress={() => {
                haptics.light();
                onHint();
              }}
              style={[
                styles.specialKey,
                { backgroundColor: colors.purple, borderRadius: borderRadius.sm },
              ]}
              accessibilityLabel="Hint"
              accessibilityRole="button"
            >
              <MaterialCommunityIcons name="lightbulb-outline" size={18} color="#FFFFFF" />
            </Pressable>
          )}
          {row.map((letter) => {
            const keyColor = getKeyColor(letter);
            return (
              <Pressable
                key={letter}
                onPress={() => handleKeyPress(letter)}
                disabled={disabled}
                accessibilityLabel={letter}
                accessibilityRole="button"
                style={[
                  styles.key,
                  {
                    backgroundColor: keyColor.bg,
                    borderRadius: borderRadius.sm,
                  },
                ]}
              >
                <Text style={[styles.keyText, { color: keyColor.text }]}>{letter}</Text>
              </Pressable>
            );
          })}
          {rowIndex === rows.length - 1 && (
            <Pressable
              onPress={() => {
                haptics.light();
                onDelete();
              }}
              disabled={disabled}
              style={[
                styles.specialKey,
                { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.sm },
              ]}
              accessibilityLabel="Delete"
              accessibilityRole="button"
            >
              <Feather name="delete" size={18} color={colors.textPrimary} />
            </Pressable>
          )}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  keyboard: {
    gap: 4,
    paddingHorizontal: 2,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
  },
  key: {
    width: 32,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  keyText: {
    fontSize: 15,
    fontFamily: 'Nunito_700Bold',
  },
  specialKey: {
    width: 40,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
});
