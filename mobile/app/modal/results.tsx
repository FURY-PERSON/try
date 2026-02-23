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
  const { dailyProgress, resetDailyProgress, collectionType } = useGameStore();
  const submissionResult = useGameStore((s) => s.submissionResult);
  const { showIfReady } = useInterstitialAd();

  const results = dailyProgress.results;
  const correctCount = results.filter((r) => r.correct).length;
  const totalCards = dailyProgress.totalCards;
  const resultBools = results.map((r) => r.correct);
  const messageKey = getResultMessage(correctCount, totalCards);
  const isDaily = collectionType === 'daily';

  React.useEffect(() => {
    showIfReady();
    analytics.logEvent('game_complete', {
      score: correctCount,
      total: totalCards,
      type: collectionType,
    });
  }, [showIfReady, correctCount, totalCards, collectionType]);

  const scoreColor =
    correctCount === totalCards
      ? colors.gold
      : correctCount >= totalCards * 0.8
        ? colors.primary
        : correctCount >= totalCards * 0.5
          ? colors.blue
          : colors.orange;

  const handleShare = () => {
    shareResult({
      score: correctCount,
      total: totalCards,
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
          {correctCount}/{totalCards}
        </Text>
        <Text style={[styles.message, { color: colors.textPrimary }]}>
          {t(`results.${messageKey}`)}
        </Text>

        {submissionResult && submissionResult.correctPercent > 0 && (
          <Text style={[styles.percentText, { color: colors.primary }]}>
            {t('results.correctPercent', {
              percent: submissionResult.correctPercent,
            })}
          </Text>
        )}

        {isDaily && (
          <StreakBadge days={submissionResult?.streak ?? streak} size="md" />
        )}

        <DailyResultCard results={resultBools} />

        {/* Leaderboard position only for daily sets */}
        {isDaily && submissionResult && submissionResult.totalPlayers > 0 ? (
          <Card variant="flat" style={styles.positionCard}>
            <Text
              style={[styles.positionText, { color: colors.textSecondary }]}
            >
              {t('results.percentile', {
                percent: submissionResult.percentile,
              })}
            </Text>
          </Card>
        ) : isDaily ? (
          <Card variant="flat" style={styles.positionCard}>
            <Text
              style={[styles.positionText, { color: colors.textSecondary }]}
            >
              {t('results.position', {
                position: '—',
                total: '—',
              })}
            </Text>
          </Card>
        ) : null}
      </View>

      <View style={styles.footer}>
        <Button
          label={t('common.share')}
          variant="blue"
          size="lg"
          onPress={handleShare}
          iconLeft={<Feather name="share-2" size={18} color="#FFFFFF" />}
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
    gap: 16,
    paddingHorizontal: 32,
  },
  score: {
    fontSize: 48,
    fontFamily: 'Nunito_700Bold',
    lineHeight: 56,
  },
  message: {
    fontSize: 22,
    fontFamily: 'Nunito_700Bold',
    lineHeight: 28,
  },
  percentText: {
    fontSize: 17,
    fontFamily: 'Nunito_600SemiBold',
    textAlign: 'center',
  },
  positionCard: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  positionText: {
    fontSize: 15,
    fontFamily: 'Nunito_500Medium',
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 32,
    gap: 12,
  },
});
