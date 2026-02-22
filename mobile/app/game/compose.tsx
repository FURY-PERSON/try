import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Screen } from '@/components/layout/Screen';
import { Button } from '@/components/ui/Button';
import { GameHeader } from '@/features/game/components/GameHeader';
import { LetterTile } from '@/features/game/components/LetterTile';
import { useComposeGame } from '@/features/game/hooks/useComposeGame';
import { useGameStore } from '@/features/game/stores/useGameStore';
import { useUserStore } from '@/stores/useUserStore';
import { useThemeContext } from '@/theme';

const DEMO_LETTERS = ['К', 'О', 'Т', 'С', 'Л', 'А'];
const DEMO_WORDS = ['КОТ', 'ТОК', 'СОК', 'КОСА', 'СТОЛ'];

export default function ComposeScreen() {
  const { colors } = useThemeContext();
  const { t } = useTranslation();
  const router = useRouter();
  const streak = useUserStore((s) => s.currentStreak);
  const { dailyProgress, submitGameResult, startGame } = useGameStore();

  const game = useComposeGame(DEMO_LETTERS, DEMO_WORDS);

  React.useEffect(() => {
    startGame();
  }, [startGame]);

  const handleSubmit = () => {
    const found = game.submitWord();
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
          {t('game.compose')}
        </Text>

        <View style={styles.foundWords}>
          <Text style={[styles.foundLabel, { color: colors.textSecondary }]}>
            {game.foundWords.length}/{game.targetWords.length}
          </Text>
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
                    color: game.foundWords.includes(item) ? '#FFFFFF' : colors.textSecondary,
                    fontFamily: 'Nunito_700Bold',
                    fontSize: 13,
                  }}
                >
                  {game.foundWords.includes(item) ? item : '???'}
                </Text>
              </View>
            )}
            contentContainerStyle={{ gap: 8 }}
            showsHorizontalScrollIndicator={false}
          />
        </View>

        <View style={styles.currentWord}>
          {game.currentWord.split('').map((letter, i) => (
            <LetterTile key={i} letter={letter} state="selected" size={44} />
          ))}
          {game.currentWord.length === 0 && (
            <Text style={[styles.placeholder, { color: colors.textSecondary }]}>
              {t('game.composeDesc')}
            </Text>
          )}
        </View>

        <View style={styles.lettersCircle}>
          {game.availableLetters.map((letter, index) => (
            <LetterTile
              key={index}
              letter={letter}
              size={52}
              onPress={() => game.addLetter(letter)}
            />
          ))}
        </View>
      </View>

      <View style={styles.footer}>
        <Button
          label="⌫"
          variant="secondary"
          size="md"
          fullWidth={false}
          onPress={game.removeLetter}
          style={{ width: 56 }}
        />
        <Button
          label={t('game.check')}
          variant="primary"
          size="md"
          onPress={handleSubmit}
          style={{ flex: 1 }}
          disabled={game.currentWord.length < 3}
        />
        {game.status === 'correct' && (
          <Button label="→" variant="primary" size="md" fullWidth={false} onPress={handleFinish} style={{ width: 56 }} />
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, alignItems: 'center', gap: 24 },
  title: { fontSize: 20, fontFamily: 'Nunito_700Bold', marginTop: 12 },
  foundWords: { width: '100%', paddingHorizontal: 16 },
  foundLabel: { fontSize: 13, fontFamily: 'Nunito_600SemiBold', marginBottom: 8 },
  wordChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  currentWord: { flexDirection: 'row', gap: 6, minHeight: 48, alignItems: 'center' },
  placeholder: { fontSize: 15, fontFamily: 'Nunito_400Regular' },
  lettersCircle: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center', paddingHorizontal: 32 },
  footer: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingBottom: 32 },
});
