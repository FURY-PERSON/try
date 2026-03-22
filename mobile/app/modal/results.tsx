import React, { useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
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
import { useQueryClient } from '@tanstack/react-query';
import { Screen } from '@/components/layout/Screen';
import { Button } from '@/components/ui/Button';
import { AnimatedEntrance } from '@/components/ui/AnimatedEntrance';
import { StreakBadge } from '@/features/game/components/StreakBadge';
import { DailyResultCard } from '@/features/game/components/DailyResultCard';
import { FactOfDayCard } from '@/features/game/components/FactOfDayCard';
import { useGameStore } from '@/features/game/stores/useGameStore';
import { AdBanner } from '@/components/ads/AdBanner';
import { useAdsStore } from '@/stores/useAdsStore';
import { useThemeContext } from '@/theme';
import { fontFamily } from '@/theme/typography';
import { shareResult } from '@/utils/share';
import { getResultMessage } from '@/features/game/utils';
import { analytics } from '@/services/analytics';
import { s } from '@/utils/scale';

// Static gradient point objects
const GRADIENT_START = { x: 0, y: 0 } as const;
const GRADIENT_END_V = { x: 0, y: 1 } as const;

export default function ResultsModal() {
  const insets = useSafeAreaInsets();
  const { colors, gradients, spacing } = useThemeContext();
  const { t } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();
  const dailyProgress = useGameStore((s) => s.dailyProgress);
  const resetDailyProgress = useGameStore((s) => s.resetDailyProgress);
  const collectionType = useGameStore((s) => s.collectionType);
  const isReplay = useGameStore((s) => s.isReplay);
  const submissionResult = useGameStore((s) => s.submissionResult);
  const addFactsAnswered = useAdsStore((s) => s.addFactsAnswered);

  const results = dailyProgress.results;
  const correctCount = useMemo(() => results.filter((r) => r.correct).length, [results]);
  const totalCards = dailyProgress.totalCards;
  const resultBools = useMemo(() => results.map((r) => r.correct), [results]);
  const messageKey = getResultMessage(correctCount, totalCards);
  const percent = totalCards > 0 ? correctCount / totalCards : 0;

  // Animated count-up for score
  const displayCount = useSharedValue(0);
  const scoreScale = useSharedValue(0.5);
  const scoreOpacity = useSharedValue(0);

  useEffect(() => {
    // useCardGame already flushed every completed group of 3 mid-game;
    // here we only save the remainder so total count stays exact.
    const remainder = totalCards % 3;
    if (remainder > 0) addFactsAnswered(remainder);
    analytics.logEvent('collection_complete', {
      type: collectionType,
      correctCount,
      total: totalCards,
    });
  }, [correctCount, totalCards, collectionType, addFactsAnswered]);

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

  const streak = submissionResult?.streak ?? 0;

  const handleShare = useCallback(() => {
    shareResult({
      score: correctCount,
      total: totalCards,
      streak,
      results: resultBools,
    });
    analytics.logEvent('share_result');
  }, [correctCount, totalCards, streak, resultBools]);

  const handleGoHome = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['home', 'feed'] });
    queryClient.invalidateQueries({ queryKey: ['user', 'stats'] });
    resetDailyProgress();
    router.dismissAll();
  }, [queryClient, resetDailyProgress, router]);

  return (
    <Screen style={[styles.screen, { paddingTop: insets.top }]}>
      {/* Performance gradient header */}
      <LinearGradient
        colors={[bgGradient[0] + '30', bgGradient[1] + '10', 'transparent']}
        start={GRADIENT_START}
        end={GRADIENT_END_V}
        style={styles.headerGradient}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
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

        {isReplay && (
          <AnimatedEntrance delay={200} direction="up">
            <View style={[styles.replayBanner, { backgroundColor: colors.orange + '20' }]}>
              <Feather name="rotate-ccw" size={16} color={colors.orange} />
              <Text style={[styles.replayBannerText, { color: colors.orange }]}>
                {t('results.replayBanner')}
              </Text>
            </View>
          </AnimatedEntrance>
        )}

        {!isReplay && submissionResult && submissionResult.correctPercent > 0 && (
          <AnimatedEntrance delay={200} direction="up">
            <Text style={[styles.percentText, { color: colors.primary }]}>
              {t('results.correctPercent', {
                percent: submissionResult.correctPercent,
              })}
            </Text>
          </AnimatedEntrance>
        )}

        {!isReplay && (
          <AnimatedEntrance delay={300} direction="up">
            <StreakBadge days={submissionResult?.streak ?? streak} size="md" />
          </AnimatedEntrance>
        )}

        {!isReplay && submissionResult?.factOfDay && (
          <AnimatedEntrance delay={400} direction="up">
            <FactOfDayCard factOfDay={submissionResult.factOfDay} />
          </AnimatedEntrance>
        )}

        <AnimatedEntrance delay={submissionResult?.factOfDay ? 500 : 400} direction="up">
          <DailyResultCard results={resultBools} />
        </AnimatedEntrance>

      </ScrollView>

      <AnimatedEntrance delay={600} direction="up">
        <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
          <Button
            label={t('results.goHome')}
            variant="primary"
            size="lg"
            onPress={handleGoHome}
          />
        </View>
      </AnimatedEntrance>

      <View style={[styles.adOverlay, { bottom: insets.bottom + 80 }]} pointerEvents="box-none">
        <AdBanner placement="results" size="LARGE" />
      </View>
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
    height: s(300),
  },
  scrollView: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: s(16),
    paddingHorizontal: s(32),
    paddingVertical: s(16),
  },
  scoreContainer: {
    alignItems: 'center',
  },
  score: {
    fontSize: s(56),
    fontFamily: fontFamily.black,
    lineHeight: s(64),
    letterSpacing: -1,
  },
  message: {
    fontSize: s(22),
    fontFamily: fontFamily.bold,
    lineHeight: s(28),
    textAlign: 'center',
  },
  percentText: {
    fontSize: s(17),
    fontFamily: fontFamily.semiBold,
    textAlign: 'center',
  },
  replayBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(8),
    paddingVertical: s(10),
    paddingHorizontal: s(16),
    borderRadius: s(12),
  },
  replayBannerText: {
    fontSize: s(14),
    fontFamily: fontFamily.semiBold,
  },
  footer: {
    paddingHorizontal: s(20),
    gap: s(12),
  },
  adOverlay: {
    position: 'absolute',
    left: 20,
    right: 20,
  },
});
