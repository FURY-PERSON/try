import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Feather } from '@expo/vector-icons';
import { Screen } from '@/components/layout/Screen';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { StreakBadge } from '@/features/game/components/StreakBadge';
import { DailyResultCard } from '@/features/game/components/DailyResultCard';
import { useGameStore } from '@/features/game/stores/useGameStore';
import { useUserStore } from '@/stores/useUserStore';
import { useInterstitialAd } from '@/components/ads/InterstitialManager';
import { useThemeContext } from '@/theme';
import { shareResult } from '@/utils/share';
import { getResultMessage } from '@/features/game/utils';
import { analytics } from '@/services/analytics';

export default function ResultsModal() {
  const { colors } = useThemeContext();
  const { t } = useTranslation();
  const router = useRouter();
  const streak = useUserStore((s) => s.currentStreak);
  const { dailyProgress, resetDailyProgress } = useGameStore();
  const { showIfReady } = useInterstitialAd();

  const results = dailyProgress.results;
  const correctCount = results.filter((r) => r.correct).length;
  const totalGames = dailyProgress.totalGames;
  const resultBools = results.map((r) => r.correct);
  const messageKey = getResultMessage(correctCount, totalGames);

  React.useEffect(() => {
    showIfReady();
    analytics.logEvent('daily_set_complete', {
      score: correctCount,
      total: totalGames,
    });
  }, [showIfReady, correctCount, totalGames]);

  const scoreColor =
    correctCount === totalGames
      ? colors.gold
      : correctCount >= 4
        ? colors.primary
        : correctCount >= 3
          ? colors.blue
          : colors.orange;

  const handleShare = () => {
    shareResult({
      score: correctCount,
      total: totalGames,
      streak,
      results: resultBools,
    });
    analytics.logEvent('share_result');
  };

  const handleGoHome = () => {
    resetDailyProgress();
    router.replace('/(tabs)/home');
  };

  return (
    <Screen style={styles.screen}>
      <View style={styles.content}>
        <Text style={[styles.score, { color: scoreColor }]}>
          {correctCount}/{totalGames}
        </Text>
        <Text style={[styles.message, { color: colors.textPrimary }]}>
          {t(`results.${messageKey}`)}
        </Text>

        <StreakBadge days={streak} size="md" />

        <DailyResultCard results={resultBools} />

        <Card variant="flat" style={styles.positionCard}>
          <Text style={[styles.positionText, { color: colors.textSecondary }]}>
            {t('results.position', { position: 42, total: 487 })}
          </Text>
        </Card>
      </View>

      <View style={styles.footer}>
        <Button
          label={t('common.share')}
          variant="blue"
          size="lg"
          onPress={handleShare}
          iconLeft={<Feather name="share-2" size={20} color="#FFFFFF" />}
        />
        <Button
          label={t('results.goHome')}
          variant="secondary"
          size="lg"
          onPress={handleGoHome}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    paddingHorizontal: 32,
  },
  score: {
    fontSize: 48,
    fontFamily: 'Nunito_900Black',
  },
  message: {
    fontSize: 24,
    fontFamily: 'Nunito_800ExtraBold',
  },
  positionCard: {
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  positionText: {
    fontSize: 15,
    fontFamily: 'Nunito_600SemiBold',
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    gap: 12,
  },
});
