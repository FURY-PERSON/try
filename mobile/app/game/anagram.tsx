import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Screen } from '@/components/layout/Screen';
import { Button } from '@/components/ui/Button';
import { GameHeader } from '@/features/game/components/GameHeader';
import { LetterTile } from '@/features/game/components/LetterTile';
import { HintButton } from '@/features/game/components/HintButton';
import { useAnagramGame } from '@/features/game/hooks/useAnagramGame';
import { useGameStore } from '@/features/game/stores/useGameStore';
import { useUserStore } from '@/stores/useUserStore';
import { useRewardedAd } from '@/components/ads/RewardedAdManager';
import { useThemeContext } from '@/theme';

// Demo data — in production, fetched from API
const DEMO_DATA = {
  scrambledLetters: ['К', 'О', 'С', 'М', 'О', 'С'],
  correctWord: 'КОСМОС',
};

export default function AnagramScreen() {
  const { colors } = useThemeContext();
  const { t } = useTranslation();
  const router = useRouter();
  const streak = useUserStore((s) => s.currentStreak);
  const { dailyProgress, submitGameResult, startGame } = useGameStore();
  const { showForReward, isReady: rewardReady } = useRewardedAd();
  const [showFact, setShowFact] = useState(false);

  const game = useAnagramGame(DEMO_DATA);

  React.useEffect(() => {
    startGame();
  }, [startGame]);

  const handleCheck = () => {
    const result = game.checkAnswer();
    submitGameResult(result);
    setShowFact(true);
  };

  const handleHint = async () => {
    const rewarded = await showForReward();
    if (rewarded) {
      game.useHint();
    }
  };

  const handleNext = () => {
    if (dailyProgress.completed) {
      router.replace('/modal/results');
    } else {
      router.back();
    }
  };

  if (showFact) {
    return (
      <Screen>
        <View style={styles.factContainer}>
          <Text style={[styles.resultEmoji, { color: colors.textPrimary }]}>
            {game.status === 'correct' ? '✅' : '❌'}
          </Text>
          <Text style={[styles.resultText, { color: colors.textPrimary }]}>
            {game.status === 'correct' ? t('game.correct') : t('game.incorrect')}
          </Text>
          <Text style={[styles.correctWord, { color: colors.primary }]}>
            {DEMO_DATA.correctWord}
          </Text>
          <View style={styles.factFooter}>
            <Button
              label={`${t('common.next')} →`}
              variant="primary"
              size="lg"
              onPress={handleNext}
            />
          </View>
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
          {t('game.anagram')}
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {t('game.anagramDesc')}
        </Text>

        <View style={styles.answerRow}>
          {DEMO_DATA.correctWord.split('').map((_, index) => {
            const letter = game.answer[index];
            return (
              <LetterTile
                key={`answer-${index}`}
                letter={letter ?? ' '}
                state={
                  game.status === 'correct'
                    ? 'correct'
                    : game.status === 'incorrect'
                      ? 'incorrect'
                      : letter
                        ? 'selected'
                        : 'default'
                }
                onPress={letter ? () => game.removeLetter(index) : undefined}
              />
            );
          })}
        </View>

        <View style={styles.scrambledRow}>
          {game.scrambled.map((letter, index) => (
            <LetterTile
              key={`scrambled-${index}`}
              letter={letter}
              size={48}
              onPress={() => game.selectLetter(index)}
            />
          ))}
        </View>
      </View>

      <View style={styles.footer}>
        <HintButton
          onPress={handleHint}
          disabled={!rewardReady}
          used={game.hintUsed}
        />
        <Button
          label={t('game.check')}
          variant="primary"
          size="md"
          fullWidth={false}
          disabled={!game.canCheck}
          onPress={handleCheck}
          style={{ flex: 1 }}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 32,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Nunito_800ExtraBold',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    fontFamily: 'Nunito_400Regular',
    textAlign: 'center',
  },
  answerRow: {
    flexDirection: 'row',
    gap: 8,
  },
  scrambledRow: {
    flexDirection: 'row',
    gap: 8,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  factContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  resultEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  resultText: {
    fontSize: 24,
    fontFamily: 'Nunito_800ExtraBold',
    marginBottom: 8,
  },
  correctWord: {
    fontSize: 28,
    fontFamily: 'Nunito_900Black',
    marginBottom: 32,
  },
  factFooter: {
    width: '100%',
    paddingHorizontal: 16,
  },
});
