import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Feather } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Screen } from '@/components/layout/Screen';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { AnimatedEntrance } from '@/components/ui/AnimatedEntrance';
import { StreakBadge } from '@/features/game/components/StreakBadge';
import { DailyResultCard } from '@/features/game/components/DailyResultCard';
import { useGameStore } from '@/features/game/stores/useGameStore';
import { useUserStore } from '@/stores/useUserStore';
import { useInterstitialAd } from '@/components/ads/InterstitialManager';
import { useThemeContext } from '@/theme';
import { fontFamily } from '@/theme/typography';
import { shareResult } from '@/utils/share';
import { getResultMessage } from '@/features/game/utils';
import { analytics } from '@/services/analytics';

export default function ResultsModal() {
  const insets = useSafeAreaInsets();
  const { colors, gradients, spacing, borderRadius } = useThemeContext();
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
  const percent = totalCards > 0 ? correctCount / totalCards : 0;

  // Animated count-up for score
  const displayCount = useSharedValue(0);
  const scoreScale = useSharedValue(0.5);
  const scoreOpacity = useSharedValue(0);

  useEffect(() => {
    showIfReady();
    analytics.logEvent('collection_complete', {
      type: collectionType,
      correctCount,
      total: totalCards,
    });
  }, [showIfReady, correctCount, totalCards, collectionType]);

  useEffect(() => {
    scoreOpacity.value = withTiming(1, { duration: 300 });
    scoreScale.value = withSpring(1, { damping: 12, stiffness: 200 });
    displayCount.value = withTiming(correctCount, {
      duration: 800,
      easing: Easing.out(Easing.cubic),
    });
  }, [correctCount]);

  const scoreAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scoreScale.value }],
    opacity: scoreOpacity.value,
  }));

  // Performance-based gradient
  const bgGradient =
    percent >= 0.8
      ? gradients.success
      : percent >= 0.5
        ? gradients.primary
        : gradients.warm;

  const scoreColor =
    correctCount === totalCards
      ? colors.gold
      : correctCount >= totalCards * 0.8
        ? colors.emerald
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
    <Screen style={[styles.screen, { paddingTop: insets.top }]}>
      {/* Performance gradient header */}
      <LinearGradient
        colors={[bgGradient[0] + '30', bgGradient[1] + '10', 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.headerGradient}
      />

      <View style={styles.content}>
        <AnimatedEntrance delay={0} direction="up">
          <Animated.View style={[styles.scoreContainer, scoreAnimatedStyle]}>
            <Text style={[styles.score, { color: scoreColor }]}>
              {correctCount}/{totalCards}
            </Text>
          </Animated.View>
        </AnimatedEntrance>

        <AnimatedEntrance delay={100} direction="up">
          <Text style={[styles.message, { color: colors.textPrimary }]}>
            {t(`results.${messageKey}`)}
          </Text>
        </AnimatedEntrance>

        {submissionResult && submissionResult.correctPercent > 0 && (
          <AnimatedEntrance delay={200} direction="up">
            <Text style={[styles.percentText, { color: colors.primary }]}>
              {t('results.correctPercent', {
                percent: submissionResult.correctPercent,
              })}
            </Text>
          </AnimatedEntrance>
        )}

        {isDaily && (
          <AnimatedEntrance delay={300} direction="up">
            <StreakBadge days={submissionResult?.streak ?? streak} size="md" />
          </AnimatedEntrance>
        )}

        <AnimatedEntrance delay={400} direction="up">
          <DailyResultCard results={resultBools} />
        </AnimatedEntrance>

        {/* Leaderboard position only for daily sets */}
        {isDaily && submissionResult && submissionResult.totalPlayers > 0 ? (
          <AnimatedEntrance delay={500} direction="up">
            <Card variant="default" style={{ ...styles.positionCard, borderRadius: borderRadius.lg }}>
              <Text style={[styles.positionText, { color: colors.textSecondary }]}>
                {t('results.percentile', {
                  percent: submissionResult.percentile,
                })}
              </Text>
            </Card>
          </AnimatedEntrance>
        ) : isDaily ? (
          <AnimatedEntrance delay={500} direction="up">
            <Card variant="default" style={{ ...styles.positionCard, borderRadius: borderRadius.lg }}>
              <Text style={[styles.positionText, { color: colors.textSecondary }]}>
                {t('results.position', {
                  position: '—',
                  total: '—',
                })}
              </Text>
            </Card>
          </AnimatedEntrance>
        ) : null}
      </View>

      <AnimatedEntrance delay={600} direction="up">
        <View style={styles.footer}>
          <Button
            label={t('common.share')}
            variant="primary"
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
      </AnimatedEntrance>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    justifyContent: 'space-between',
  },
  headerGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 300,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingHorizontal: 32,
  },
  scoreContainer: {
    alignItems: 'center',
  },
  score: {
    fontSize: 56,
    fontFamily: fontFamily.black,
    lineHeight: 64,
    letterSpacing: -1,
  },
  message: {
    fontSize: 22,
    fontFamily: fontFamily.bold,
    lineHeight: 28,
    textAlign: 'center',
  },
  percentText: {
    fontSize: 17,
    fontFamily: fontFamily.semiBold,
    textAlign: 'center',
  },
  positionCard: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  positionText: {
    fontSize: 15,
    fontFamily: fontFamily.medium,
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 32,
    gap: 12,
  },
});
