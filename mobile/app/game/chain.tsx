import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Feather } from '@expo/vector-icons';
import { Screen } from '@/components/layout/Screen';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { GameHeader } from '@/features/game/components/GameHeader';
import { useChainGame } from '@/features/game/hooks/useChainGame';
import { useGameStore } from '@/features/game/stores/useGameStore';
import { useUserStore } from '@/stores/useUserStore';
import { useThemeContext } from '@/theme';

export default function ChainScreen() {
  const { colors } = useThemeContext();
  const { t } = useTranslation();
  const router = useRouter();
  const streak = useUserStore((s) => s.currentStreak);
  const { dailyProgress, submitGameResult, startGame } = useGameStore();

  const game = useChainGame('КОТ', 'ТОК', 3);

  React.useEffect(() => {
    startGame();
  }, [startGame]);

  const handleSubmit = () => {
    const success = game.submitStep();
    if (game.status === 'correct') {
      const result = game.getResult();
      submitGameResult(result);
    }
  };

  const handleNext = () => {
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
          {t('game.chain')}
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {t('game.chainDesc')}
        </Text>

        <View style={styles.chain}>
          {game.chain.map((word, index) => (
            <React.Fragment key={index}>
              <Card variant="flat" style={styles.wordCard}>
                <Text style={[styles.word, { color: colors.textPrimary }]}>{word}</Text>
              </Card>
              {index < game.chain.length - 1 && (
                <Feather name="arrow-down" size={20} color={colors.textSecondary} />
              )}
            </React.Fragment>
          ))}

          {game.status === 'playing' && (
            <>
              <Feather name="arrow-down" size={20} color={colors.textSecondary} />
              <Input
                variant="answer"
                value={game.currentWord}
                onChangeText={game.setCurrentWord}
                placeholder="..."
                autoFocus
                maxLength={game.startWord.length}
              />
              <Feather name="arrow-down" size={20} color={colors.textSecondary} />
              <Card variant="highlighted" highlightColor={colors.primary} style={styles.wordCard}>
                <Text style={[styles.word, { color: colors.primary }]}>{game.endWord}</Text>
              </Card>
            </>
          )}
        </View>
      </View>

      <View style={styles.footer}>
        {game.status === 'playing' ? (
          <Button
            label={t('game.check')}
            variant="primary"
            size="lg"
            onPress={handleSubmit}
            disabled={game.currentWord.length !== game.startWord.length}
          />
        ) : (
          <Button
            label={`${t('common.next')} →`}
            variant="primary"
            size="lg"
            onPress={handleNext}
          />
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, alignItems: 'center', paddingTop: 16, gap: 12 },
  title: { fontSize: 24, fontFamily: 'Nunito_800ExtraBold' },
  subtitle: { fontSize: 15, fontFamily: 'Nunito_400Regular' },
  chain: { alignItems: 'center', gap: 8, marginTop: 16, width: '100%', paddingHorizontal: 32 },
  wordCard: { paddingVertical: 12, paddingHorizontal: 24 },
  word: { fontSize: 24, fontFamily: 'Nunito_900Black', textAlign: 'center' },
  footer: { paddingHorizontal: 16, paddingBottom: 32 },
});
