import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { OverlayModal } from '@/components/feedback/OverlayModal';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Screen } from '@/components/layout/Screen';
import { GameHeader } from '@/features/game/components/GameHeader';
import { FlipSwipeCard } from '@/features/game/components/FlipSwipeCard';
import { SwipeHintOverlay } from '@/features/game/components/SwipeHintOverlay';
import { Skeleton } from '@/components/feedback/Skeleton';
import { ErrorState } from '@/components/feedback/ErrorState';
import { useDailySet } from '@/features/game/hooks/useDailySet';
import { useCardGame } from '@/features/game/hooks/useCardGame';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useGameStore } from '@/features/game/stores/useGameStore';
import { useAppStore } from '@/stores/useAppStore';
import { collectionsApi } from '@/features/collections/api/collectionsApi';
import { AdBanner } from '@/components/ads/AdBanner';
import { useInterstitialAd } from '@/components/ads/InterstitialManager';
import { useAdsStore } from '@/stores/useAdsStore';
import { useThemeContext } from '@/theme';
import { fontFamily } from '@/theme/typography';
import type { DailySetQuestion } from '@/shared';

// Static LinearGradient point objects
const GRADIENT_START = { x: 0, y: 0 } as const;
const GRADIENT_END_V = { x: 0, y: 1 } as const;

export default function CardScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const params = useLocalSearchParams<{ mode?: string }>();
  const language = useSettingsStore((s) => s.language);
  const collectionType = useGameStore((s) => s.collectionType);
  const currentStreak = useGameStore((s) => s.currentStreak);
  const isReplay = useGameStore((s) => s.isReplay);
  const storedCollectionQuestions = useGameStore((s) => s.collectionQuestions);
  const insets = useSafeAreaInsets();
  const { colors, gradients } = useThemeContext();
  const { t } = useTranslation();

  const isCollectionMode = params.mode === 'collection';
  const sessionId = useGameStore((s) => s.sessionId);
  const dailyProgress = useGameStore((s) => s.dailyProgress);
  const setTotalCards = useGameStore((s) => s.setTotalCards);
  const setSubmissionResult = useGameStore((s) => s.setSubmissionResult);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [exitSaving, setExitSaving] = useState(false);
  const [showSwipeHint, setShowSwipeHint] = useState(false);
  const [swipeHintVariant, setSwipeHintVariant] = useState<'answer' | 'continue'>('answer');
  const hasSeenSwipeAnswerHint = useAppStore((s) => s.hasSeenSwipeAnswerHint);
  const hasSeenSwipeContinueHint = useAppStore((s) => s.hasSeenSwipeContinueHint);
  const markSwipeAnswerHintSeen = useAppStore((s) => s.markSwipeAnswerHintSeen);
  const markSwipeContinueHintSeen = useAppStore((s) => s.markSwipeContinueHintSeen);

  // Task 5: Show interstitial 500ms after game screen opens
  const { showForGameStart: showInterstitial } = useInterstitialAd();
  const interstitialShownRef = useRef(false);

  useEffect(() => {
    if (interstitialShownRef.current) return;
    const timer = setTimeout(async () => {
      if (!interstitialShownRef.current) {
        interstitialShownRef.current = true;
        await showInterstitial();
        // Mark first game today AFTER interstitial check so the check sees the real state
        useAdsStore.getState().markFirstGameToday();
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [showInterstitial]);

  const handleExitWithSave = useCallback(async () => {
    if (exitSaving) return;
    setExitSaving(true);
    try {
      if (isCollectionMode && sessionId) {
        // For collections — submit partial results and show results screen
        const gameResults = dailyProgress.results.map((r) => ({
          questionId: r.questionId,
          result: r.correct ? ('correct' as const) : ('incorrect' as const),
          timeSpentSeconds: Math.round(r.timeSpentMs / 1000),
        }));
        if (gameResults.length > 0) {
          const result = await collectionsApi.submit(sessionId, gameResults);
          setTotalCards(gameResults.length);
          setSubmissionResult({
            ...result,
            correctPercent: Math.round((result.correctAnswers / result.totalQuestions) * 100),
            leaderboardPosition: 0,
            totalPlayers: 0,
            percentile: 0,
          });
        }
        setShowExitConfirm(false);
        router.replace('/modal/results');
      } else {
        // For daily set — answers already saved via submitAnswer, invalidate caches and exit
        queryClient.invalidateQueries({ queryKey: ['home', 'feed'] });
        queryClient.invalidateQueries({ queryKey: ['dailySet', 'today'] });
        queryClient.invalidateQueries({ queryKey: ['user', 'stats'] });
        setShowExitConfirm(false);
        router.dismissAll();
      }
    } catch {
      setShowExitConfirm(false);
      router.dismissAll();
    } finally {
      setExitSaving(false);
    }
  }, [isCollectionMode, sessionId, exitSaving, dailyProgress.results, setTotalCards, setSubmissionResult, router]);

  const collectionQuestions: DailySetQuestion[] = useMemo(() => {
    if (!isCollectionMode || storedCollectionQuestions.length === 0) return [];
    return storedCollectionQuestions.map((q, i) => ({
      id: q.id,
      statement: q.statement ?? '',
      statementEn: q.statementEn ?? '',
      isTrue: q.isTrue ?? false,
      explanation: q.explanation ?? '',
      explanationEn: q.explanationEn ?? '',
      source: q.source ?? '',
      sourceEn: q.sourceEn ?? '',
      sourceUrl: q.sourceUrl ?? null,
      sourceUrlEn: q.sourceUrlEn ?? null,
      language: q.language ?? 'ru',
      categoryId: q.categoryId ?? '',
      difficulty: q.difficulty ?? 3,
      illustrationUrl: q.illustrationUrl ?? null,
      category: q.category ?? undefined,
      sortOrder: i + 1,
    }));
  }, [isCollectionMode, storedCollectionQuestions]);

  const { data: dailyData, isLoading, isError, error, refetch } = useDailySet();

  const questions = useMemo(() => {
    if (isCollectionMode) return collectionQuestions;
    if (!dailyData?.questions) return [];
    return [...dailyData.questions].sort((a, b) => a.sortOrder - b.sortOrder);
  }, [isCollectionMode, collectionQuestions, dailyData]);

  const dailySetId = isCollectionMode ? null : (dailyData?.id ?? null);

  const {
    currentQuestion,
    currentIndex,
    totalCards,
    feedback,
    isSubmitting,
    isComplete,
    progress,
    liveStreak,
    handleSwipe,
    handleNextCard,
  } = useCardGame(questions, dailySetId);

  // Show swipe-to-answer hint on first ever game
  useEffect(() => {
    if (currentQuestion && currentIndex === 0 && !feedback && !hasSeenSwipeAnswerHint) {
      setSwipeHintVariant('answer');
      setShowSwipeHint(true);
    }
  }, [currentQuestion, currentIndex, feedback, hasSeenSwipeAnswerHint]);

  // Show swipe-to-continue hint on first ever feedback
  useEffect(() => {
    if (feedback && !hasSeenSwipeContinueHint) {
      setSwipeHintVariant('continue');
      setShowSwipeHint(true);
    }
  }, [feedback, hasSeenSwipeContinueHint]);

  const dismissSwipeHint = useCallback(() => {
    setShowSwipeHint(false);
    if (swipeHintVariant === 'answer') {
      markSwipeAnswerHintSeen();
    } else {
      markSwipeContinueHintSeen();
    }
  }, [swipeHintVariant, markSwipeAnswerHintSeen, markSwipeContinueHintSeen]);

  const showHintManually = useCallback((variant: 'answer' | 'continue') => {
    setSwipeHintVariant(variant);
    setShowSwipeHint(true);
  }, []);

  useEffect(() => {
    if (isComplete && !feedback) {
      router.replace('/modal/results');
    }
  }, [isComplete, feedback, router]);


  if (!isCollectionMode && isLoading) {
    return (
      <Screen style={{ paddingTop: insets.top }}>
        <Skeleton width="100%" height={48} shape="rectangle" />
        <Skeleton width="100%" height={300} shape="card" style={{ marginTop: 32 }} />
      </Screen>
    );
  }

  if (!isCollectionMode && isError) {
    return (
      <Screen style={{ paddingTop: insets.top }}>
        <ErrorState message={error?.message} onRetry={refetch} />
      </Screen>
    );
  }

  if (!currentQuestion && !feedback) {
    return (
      <Screen style={{ paddingTop: insets.top }}>
        <ErrorState message="No questions available" onRetry={refetch} />
      </Screen>
    );
  }

  const categoryName =
    currentQuestion?.category
      ? (language === 'en'
          ? (currentQuestion.category.nameEn || currentQuestion.category.name)
          : currentQuestion.category.name)
      : '';

  const statement = currentQuestion
    ? (language === 'en' && currentQuestion.statementEn ? currentQuestion.statementEn : currentQuestion.statement)
    : '';

  const nextQuestion = questions[currentIndex + 1] ?? null;
  const nextCategoryName = nextQuestion?.category
    ? (language === 'en' ? (nextQuestion.category.nameEn || nextQuestion.category.name) : nextQuestion.category.name)
    : '';
  const nextStatement = nextQuestion
    ? (language === 'en' && nextQuestion.statementEn ? nextQuestion.statementEn : nextQuestion.statement)
    : undefined;

  return (
    <Screen padded={false} backgroundColor={gradients.card[0]}>
      <LinearGradient
        colors={gradients.card}
        start={GRADIENT_START}
        end={GRADIENT_END_V}
        style={styles.gradient}
      >
        <View style={[styles.padded, { paddingTop: insets.top }]}>
          <GameHeader
            progress={progress}
            streak={isReplay ? 0 : liveStreak}
            onClose={() => setShowExitConfirm(true)}
          />
        </View>

        <Text style={[styles.counterText, { color: colors.textTertiary }]}>
          {currentIndex + 1} / {totalCards}
        </Text>

        {currentQuestion ? (
          <View style={styles.cardArea}>
            <View style={styles.hintsRow}>
              {feedback ? (
                <Animated.View
                  key="continue"
                  entering={FadeIn.duration(300)}
                  exiting={FadeOut.duration(150)}
                  style={styles.hintsContent}
                >
                  <Pressable
                    onPress={() => showHintManually('continue')}
                    style={[styles.hintBadge, { backgroundColor: colors.primary + '10', borderWidth: 1, borderColor: colors.primary + '20' }]}
                  >
                    <Text style={[styles.hintText, { color: colors.primary }]}>
                      ← {t('game.continue')}
                    </Text>
                  </Pressable>
                  <Text style={[styles.hintCenter, { color: colors.textTertiary }]}>
                    {t('game.swipeToContinue')}
                  </Text>
                  <Pressable
                    onPress={() => showHintManually('continue')}
                    style={[styles.hintBadge, { backgroundColor: colors.primary + '10', borderWidth: 1, borderColor: colors.primary + '20' }]}
                  >
                    <Text style={[styles.hintText, { color: colors.primary }]}>
                      {t('game.continue')} →
                    </Text>
                  </Pressable>
                </Animated.View>
              ) : (
                <Animated.View
                  key="answer"
                  entering={FadeIn.duration(300)}
                  exiting={FadeOut.duration(150)}
                  style={styles.hintsContent}
                >
                  <Pressable
                    onPress={() => showHintManually('answer')}
                    style={[styles.hintBadge, { backgroundColor: colors.red + '10', borderWidth: 1, borderColor: colors.red + '20' }]}
                  >
                    <Text style={[styles.hintText, { color: colors.red }]}>
                      ← {t('game.fake')}
                    </Text>
                  </Pressable>
                  <Text style={[styles.hintCenter, { color: colors.textTertiary }]}>
                    {t('game.swipeHint')}
                  </Text>
                  <Pressable
                    onPress={() => showHintManually('answer')}
                    style={[styles.hintBadge, { backgroundColor: colors.emerald + '10', borderWidth: 1, borderColor: colors.emerald + '20' }]}
                  >
                    <Text style={[styles.hintText, { color: colors.emerald }]}>
                      {t('game.fact')} →
                    </Text>
                  </Pressable>
                </Animated.View>
              )}
            </View>
            <View style={styles.padded}>
              <FlipSwipeCard
                statement={statement}
                categoryName={categoryName}
                cardIndex={currentIndex}
                totalCards={totalCards}
                feedback={feedback}
                onSwipe={handleSwipe}
                onDismiss={handleNextCard}
                disabled={isSubmitting}
                isSubmitting={isSubmitting}
                nextStatement={nextStatement}
                nextCategoryName={nextCategoryName}
              />
            </View>
          </View>
        ) : null}
      </LinearGradient>

      <View style={[styles.adOverlay, { bottom: insets.bottom, paddingHorizontal: 20 }]}>
        <AdBanner placement="game" />
      </View>

      <OverlayModal visible={showExitConfirm} onClose={() => setShowExitConfirm(false)}>
        <View style={[styles.modalContent, { backgroundColor: colors.surface, borderRadius: 20 }]}>
          <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
            {t('game.exitTitle')}
          </Text>
          <Text style={[styles.modalDesc, { color: colors.textSecondary }]}>
            {t('game.exitDesc')}
          </Text>
          <View style={styles.modalButtons}>
            <Pressable
              onPress={() => setShowExitConfirm(false)}
              style={[styles.modalButton, { backgroundColor: colors.surfaceVariant }]}
            >
              <Text style={[styles.modalButtonText, { color: colors.textPrimary }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
                {t('common.cancel')}
              </Text>
            </Pressable>
            <Pressable
              onPress={handleExitWithSave}
              disabled={exitSaving}
              style={[styles.modalButton, { backgroundColor: colors.primary }]}
            >
              <Text style={[styles.modalButtonText, { color: '#FFFFFF' }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
                {t('game.exitSave')}
              </Text>
            </Pressable>
          </View>
        </View>
      </OverlayModal>

      <SwipeHintOverlay
        variant={swipeHintVariant}
        visible={showSwipeHint}
        onDismiss={dismissSwipeHint}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  padded: {
    paddingHorizontal: 20,
  },
  cardArea: {
    flex: 1,
    justifyContent: 'center',
    paddingBottom: '20%',
  },
  counterText: {
    fontSize: 15,
    fontFamily: fontFamily.semiBold,
    textAlign: 'center',
    marginTop: 4,
    letterSpacing: 0.5,
  },
  hintsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
    height: 40,
  },
  hintsContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  hintBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  hintText: {
    fontSize: 13,
    fontFamily: fontFamily.semiBold,
  },
  hintCenter: {
    fontSize: 12,
    fontFamily: fontFamily.regular,
  },
  modalContent: {
    width: '100%',
    padding: 24,
    alignItems: 'center',
    gap: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: fontFamily.bold,
    textAlign: 'center',
  },
  modalDesc: {
    fontSize: 15,
    fontFamily: fontFamily.regular,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
    width: '100%',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 6,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 15,
    fontFamily: fontFamily.semiBold,
  },
  adOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 10,
  },
});
