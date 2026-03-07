import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, BackHandler } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { OverlayModal } from '@/components/feedback/OverlayModal';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
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
import type { FlipSwipeCardRef } from '@/features/game/components/FlipSwipeCard';
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

  // Undo: show previous card explanation
  const [showPreviousCard, setShowPreviousCard] = useState(false);

  // Track if user interacted via button (to suppress swipe hints)
  const usedButtonRef = useRef(false);
  const continueHintTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Ref for programmatic card control
  const cardRef = useRef<FlipSwipeCardRef>(null);

  // Android back button → show exit confirmation
  useEffect(() => {
    const handler = BackHandler.addEventListener('hardwareBackPress', () => {
      setShowExitConfirm(true);
      return true;
    });
    return () => handler.remove();
  }, []);

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
    previousFeedback,
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

  // Show swipe-to-continue hint on first ever feedback (with 1.5s delay)
  useEffect(() => {
    if (feedback && !hasSeenSwipeContinueHint && !usedButtonRef.current) {
      continueHintTimerRef.current = setTimeout(() => {
        setSwipeHintVariant('continue');
        setShowSwipeHint(true);
      }, 1500);
    }
    return () => {
      if (continueHintTimerRef.current) {
        clearTimeout(continueHintTimerRef.current);
        continueHintTimerRef.current = null;
      }
    };
  }, [feedback, hasSeenSwipeContinueHint]);

  const dismissSwipeHint = useCallback(() => {
    setShowSwipeHint(false);
    if (swipeHintVariant === 'answer') {
      markSwipeAnswerHintSeen();
    } else {
      markSwipeContinueHintSeen();
    }
  }, [swipeHintVariant, markSwipeAnswerHintSeen, markSwipeContinueHintSeen]);

  // Throttle button presses to prevent accidental double-taps
  const lastButtonPressRef = useRef(0);
  const BUTTON_THROTTLE_MS = 600;

  // Button press handlers — trigger programmatic card animation
  const handleFakePress = useCallback(() => {
    const now = Date.now();
    if (now - lastButtonPressRef.current < BUTTON_THROTTLE_MS) return;
    lastButtonPressRef.current = now;
    usedButtonRef.current = true;
    if (continueHintTimerRef.current) {
      clearTimeout(continueHintTimerRef.current);
      continueHintTimerRef.current = null;
    }
    cardRef.current?.programmaticSwipe('left');
  }, []);

  const handleFactPress = useCallback(() => {
    const now = Date.now();
    if (now - lastButtonPressRef.current < BUTTON_THROTTLE_MS) return;
    lastButtonPressRef.current = now;
    usedButtonRef.current = true;
    if (continueHintTimerRef.current) {
      clearTimeout(continueHintTimerRef.current);
      continueHintTimerRef.current = null;
    }
    cardRef.current?.programmaticSwipe('right');
  }, []);

  const handleNextPress = useCallback(() => {
    const now = Date.now();
    if (now - lastButtonPressRef.current < BUTTON_THROTTLE_MS) return;
    lastButtonPressRef.current = now;
    usedButtonRef.current = true;
    if (continueHintTimerRef.current) {
      clearTimeout(continueHintTimerRef.current);
      continueHintTimerRef.current = null;
    }
    cardRef.current?.programmaticDismiss();
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

  if (!currentQuestion && !feedback && !isComplete) {
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

        <View style={styles.counterRow}>
          <Text style={[styles.counterText, { color: colors.textTertiary }]}>
            {currentIndex + 1} / {totalCards}
          </Text>
          {/* Undo button — show previous card explanation */}
          {previousFeedback && currentIndex > 0 && (
            <Pressable
              onPress={() => setShowPreviousCard(true)}
              style={[styles.undoButton, { backgroundColor: colors.surfaceVariant }]}
              hitSlop={8}
            >
              <Feather name="rotate-ccw" size={16} color={colors.textSecondary} />
            </Pressable>
          )}
        </View>

        {currentQuestion ? (
          <View style={styles.cardArea}>
            <View style={styles.padded}>
              <FlipSwipeCard
                ref={cardRef}
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

            {/* Action buttons below card */}
            <View style={styles.buttonsRow}>
              {feedback ? (
                <Animated.View
                  key="continue-btns"
                  entering={FadeIn.duration(300)}
                  exiting={FadeOut.duration(150)}
                  style={styles.buttonsContent}
                >
                  <Pressable
                    onPress={handleNextPress}
                    style={({ pressed }) => [
                      styles.actionButton,
                      styles.nextButton,
                      {
                        backgroundColor: pressed ? colors.primary : colors.primary + 'E6',
                        transform: [{ scale: pressed ? 0.95 : 1 }],
                      },
                    ]}
                  >
                    <Text style={styles.actionButtonTextWhite}>
                      {t('game.continue')}
                    </Text>
                    <Feather name="chevron-right" size={18} color="#FFFFFF" />
                  </Pressable>
                </Animated.View>
              ) : (
                <Animated.View
                  key="answer-btns"
                  entering={FadeIn.duration(300)}
                  exiting={FadeOut.duration(150)}
                  style={styles.buttonsContent}
                >
                  <Pressable
                    onPress={handleFakePress}
                    disabled={isSubmitting}
                    style={({ pressed }) => [
                      styles.actionButton,
                      styles.fakeButton,
                      {
                        backgroundColor: pressed ? colors.red + '30' : colors.red + '15',
                        borderColor: colors.red + '40',
                        opacity: isSubmitting ? 0.5 : 1,
                        transform: [{ scale: pressed ? 0.95 : 1 }],
                      },
                    ]}
                  >
                    <Feather name="x" size={18} color={colors.red} />
                    <Text style={[styles.actionButtonText, { color: colors.red }]}>
                      {t('game.fake')}
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={handleFactPress}
                    disabled={isSubmitting}
                    style={({ pressed }) => [
                      styles.actionButton,
                      styles.factButton,
                      {
                        backgroundColor: pressed ? colors.emerald + '30' : colors.emerald + '15',
                        borderColor: colors.emerald + '40',
                        opacity: isSubmitting ? 0.5 : 1,
                        transform: [{ scale: pressed ? 0.95 : 1 }],
                      },
                    ]}
                  >
                    <Feather name="check" size={18} color={colors.emerald} />
                    <Text style={[styles.actionButtonText, { color: colors.emerald }]}>
                      {t('game.fact')}
                    </Text>
                  </Pressable>
                </Animated.View>
              )}
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

      {/* Previous card explanation overlay */}
      <OverlayModal visible={showPreviousCard} onClose={() => setShowPreviousCard(false)}>
        <View style={[styles.modalContent, { backgroundColor: colors.surface, borderRadius: 20 }]}>
          {previousFeedback && (
            <>
              <View style={styles.prevCardHeader}>
                <MaterialCommunityIcons
                  name={previousFeedback.userAnsweredCorrectly ? 'check-circle' : 'close-circle'}
                  size={24}
                  color={previousFeedback.userAnsweredCorrectly ? colors.emerald : colors.red}
                />
                <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                  {previousFeedback.userAnsweredCorrectly ? t('game.correct') : t('game.incorrect')}
                </Text>
              </View>
              <Text style={[styles.prevCardStatement, { color: colors.textSecondary }]}>
                &laquo;{previousFeedback.statement}&raquo;
              </Text>
              <View
                style={[
                  styles.prevCardTruthBadge,
                  { backgroundColor: (previousFeedback.isTrue ? colors.emerald : colors.red) + '15' },
                ]}
              >
                <Text style={[styles.prevCardTruthText, { color: previousFeedback.isTrue ? colors.emerald : colors.red }]}>
                  {t('game.thisIs')} {previousFeedback.isTrue ? t('game.fact') : t('game.fake')}
                </Text>
              </View>
              <Text style={[styles.prevCardExplanation, { color: colors.textPrimary }]}>
                {previousFeedback.explanation}
              </Text>
            </>
          )}
          <Pressable
            onPress={() => setShowPreviousCard(false)}
            style={[styles.prevCardCloseBtn, { backgroundColor: colors.surfaceVariant }]}
          >
            <Text style={[styles.modalButtonText, { color: colors.textPrimary }]}>
              {t('common.close')}
            </Text>
          </Pressable>
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
    paddingBottom: '30%',
  },
  counterRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
    height: 28,
    gap: 8,
  },
  counterText: {
    fontSize: 15,
    fontFamily: fontFamily.semiBold,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  undoButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonsRow: {
    paddingHorizontal: 20,
    marginTop: 24,
    height: 56,
  },
  buttonsContent: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  fakeButton: {
    flex: 1,
  },
  factButton: {
    flex: 1,
  },
  nextButton: {
    flex: 1,
    borderWidth: 0,
  },
  actionButtonText: {
    fontSize: 17,
    fontFamily: fontFamily.bold,
  },
  actionButtonTextWhite: {
    fontSize: 17,
    fontFamily: fontFamily.bold,
    color: '#FFFFFF',
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
  // Previous card overlay styles
  prevCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  prevCardStatement: {
    fontSize: 15,
    fontFamily: fontFamily.medium,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 22,
  },
  prevCardTruthBadge: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 16,
  },
  prevCardTruthText: {
    fontSize: 15,
    fontFamily: fontFamily.semiBold,
  },
  prevCardExplanation: {
    fontSize: 15,
    fontFamily: fontFamily.regular,
    lineHeight: 22,
    textAlign: 'center',
  },
  prevCardCloseBtn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 4,
  },
});
