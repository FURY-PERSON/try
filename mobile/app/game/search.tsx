import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Screen } from '@/components/layout/Screen';
import { Button } from '@/components/ui/Button';
import { GameHeader } from '@/features/game/components/GameHeader';
import { WordGrid } from '@/features/game/components/WordGrid';
import { useSearchGame } from '@/features/game/hooks/useSearchGame';
import { useGameStore } from '@/features/game/stores/useGameStore';
import { useUserStore } from '@/stores/useUserStore';
import { useThemeContext } from '@/theme';

const DEMO_GRID = [
  ['К', 'О', 'Т', 'А'],
  ['С', 'Л', 'О', 'В'],
  ['М', 'И', 'Р', 'Е'],
  ['Д', 'О', 'М', 'А'],
];

const DEMO_WORDS = ['КОТ', 'СЛОВО', 'МИР', 'ДОМ'];

export default function SearchScreen() {
  const { colors } = useThemeContext();
  const { t } = useTranslation();
  const router = useRouter();
  const streak = useUserStore((s) => s.currentStreak);
  const { dailyProgress, submitGameResult, startGame } = useGameStore();

  const game = useSearchGame(DEMO_GRID, DEMO_WORDS);

  React.useEffect(() => {
    startGame();
  }, [startGame]);

  const handleCheck = () => {
    game.checkSelection();
    if (game.status === 'correct') {
      const result = game.getResult();
      submitGameResult(result);
    }
  };

  const handleFinish = () => {
    if (game.status !== 'correct') {
      const result = game.getResult();
      submitGameResult(result);
    }
    if (dailyProgress.completed) {
      router.replace('/modal/results');
    } else {
      router.back();
    }
  };

  return (
    <Screen>
      <GameHeader
        progress={dailyProgress.currentGameIndex / dailyProgress.totalGames}
        streak={streak}
      />

      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>
          {t('game.search')}
        </Text>

        <View style={styles.wordsToFind}>
          <FlatList
            data={game.targetWords}
            horizontal
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <View
                style={[
                  styles.wordChip,
                  {
                    backgroundColor: game.foundWords.includes(item)
                      ? colors.primary
                      : colors.surfaceVariant,
                  },
                ]}
              >
                <Text
                  style={{
                    color: game.foundWords.includes(item) ? '#FFF' : colors.textPrimary,
                    fontFamily: 'Nunito_700Bold',
                    fontSize: 13,
                    textDecorationLine: game.foundWords.includes(item) ? 'line-through' : 'none',
                  }}
                >
                  {item}
                </Text>
              </View>
            )}
            contentContainerStyle={{ gap: 8 }}
            showsHorizontalScrollIndicator={false}
          />
        </View>

        <WordGrid
          grid={game.grid}
          selectedCells={game.selectedCells}
          foundWords={game.foundWords}
          onCellPress={game.selectCell}
        />
      </View>

      <View style={styles.footer}>
        {game.selectedCells.length > 0 && (
          <Button
            label="⌫"
            variant="secondary"
            size="md"
            fullWidth={false}
            onPress={game.clearSelection}
            style={{ width: 56 }}
          />
        )}
        <Button
          label={game.status === 'correct' ? `${t('common.next')} →` : t('game.check')}
          variant="primary"
          size="md"
          onPress={game.status === 'correct' ? handleFinish : handleCheck}
          disabled={game.selectedCells.length < 2 && game.status !== 'correct'}
          style={{ flex: 1 }}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, alignItems: 'center', gap: 20, paddingTop: 12 },
  title: { fontSize: 20, fontFamily: 'Nunito_700Bold' },
  wordsToFind: { paddingHorizontal: 16 },
  wordChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  footer: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingBottom: 32 },
});
