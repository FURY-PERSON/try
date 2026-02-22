import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Screen } from '@/components/layout/Screen';
import { Button } from '@/components/ui/Button';
import { GameHeader } from '@/features/game/components/GameHeader';
import { LetterTile } from '@/features/game/components/LetterTile';
import { CustomKeyboard } from '@/features/game/components/CustomKeyboard';
import { useGuessGame } from '@/features/game/hooks/useGuessGame';
import { useGameStore } from '@/features/game/stores/useGameStore';
import { useUserStore } from '@/stores/useUserStore';
import { useThemeContext } from '@/theme';

const DEMO_WORD = 'СЛОВО';

export default function GuessScreen() {
  const { colors } = useThemeContext();
  const { t } = useTranslation();
  const router = useRouter();
  const streak = useUserStore((s) => s.currentStreak);
  const { dailyProgress, submitGameResult, startGame } = useGameStore();
  const [finished, setFinished] = useState(false);

  const game = useGuessGame(DEMO_WORD, 6);

  React.useEffect(() => {
    startGame();
  }, [startGame]);

  const handleCheck = () => {
    const result = game.checkAttempt();
    if (result) {
      submitGameResult(result);
      setFinished(true);
    }
  };

  const handleNext = () => {
    if (dailyProgress.completed) {
      router.replace('/modal/results');
    } else {
      router.back();
    }
  };

  if (finished) {
    return (
      <Screen>
        <View style={styles.resultContainer}>
          <Text style={[styles.resultEmoji]}>
            {game.status === 'correct' ? '🎉' : '😔'}
          </Text>
          <Text style={[styles.resultText, { color: colors.textPrimary }]}>
            {game.status === 'correct' ? t('game.correct') : t('game.incorrect')}
          </Text>
          <Text style={[styles.correctWord, { color: colors.primary }]}>{DEMO_WORD}</Text>
          <Button label={`${t('common.next')} →`} variant="primary" size="lg" onPress={handleNext} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <GameHeader
        progress={dailyProgress.currentGameIndex / dailyProgress.totalGames}
        streak={streak}
      />

      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>
          {t('game.guess')}
        </Text>

        <View style={styles.grid}>
          {Array.from({ length: game.maxAttempts }).map((_, rowIndex) => {
            const attempt = game.attempts[rowIndex];
            const result = game.results[rowIndex];
            const isCurrent = rowIndex === game.attempts.length && game.status === 'playing';

            return (
              <View key={rowIndex} style={styles.row}>
                {Array.from({ length: game.wordLength }).map((_, colIndex) => {
                  let letter = '';
                  let state: 'default' | 'correct' | 'incorrect' | 'misplaced' = 'default';

                  if (attempt) {
                    letter = attempt[colIndex] ?? '';
                    state = (result?.[colIndex] as typeof state) ?? 'default';
                  } else if (isCurrent) {
                    letter = game.currentAttempt[colIndex] ?? '';
                  }

                  return (
                    <LetterTile
                      key={`${rowIndex}-${colIndex}`}
                      letter={letter}
                      state={state}
                      size={48}
                    />
                  );
                })}
              </View>
            );
          })}
        </View>
      </View>

      <View style={styles.keyboardContainer}>
        <CustomKeyboard
          onKeyPress={game.addLetter}
          onDelete={game.removeLetter}
          onHint={game.useHint}
          usedLetters={game.usedLetters}
          disabled={game.status !== 'playing'}
        />
        <View style={styles.checkButton}>
          <Button
            label={t('game.check')}
            variant="primary"
            size="md"
            disabled={!game.canCheck}
            onPress={handleCheck}
          />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    alignItems: 'center',
    gap: 16,
  },
  title: {
    fontSize: 20,
    fontFamily: 'Nunito_700Bold',
    textAlign: 'center',
  },
  grid: {
    gap: 4,
  },
  row: {
    flexDirection: 'row',
    gap: 4,
  },
  keyboardContainer: {
    paddingHorizontal: 4,
    paddingBottom: 16,
  },
  checkButton: {
    paddingHorizontal: 12,
    marginTop: 8,
  },
  resultContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },
  resultEmoji: {
    fontSize: 64,
  },
  resultText: {
    fontSize: 24,
    fontFamily: 'Nunito_800ExtraBold',
  },
  correctWord: {
    fontSize: 28,
    fontFamily: 'Nunito_900Black',
    marginBottom: 24,
  },
});
