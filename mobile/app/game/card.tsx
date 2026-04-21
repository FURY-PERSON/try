import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, BackHandler, ActivityIndicator } from 'react-native';
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
import { showToast } from '@/stores/useToastStore';
import type { FlipSwipeCardRef } from '@/features/game/components/FlipSwipeCard';
import type { DailySetQuestion } from '@/shared';
import { getStreakBonusPercent } from '@/features/game/utils/streakBonus';
import { useFeatureFlag, useFeatureFlagPayload } from '@/features/feature-flags/hooks/useFeatureFlag';
import { ShieldButton } from '@/features/shield/components/ShieldButton';
import { ShieldWatchVideoModal } from '@/features/shield/components/ShieldWatchVideoModal';
import { ShieldAbsorbAnimation } from '@/features/shield/components/ShieldAbsorbAnimation';
import { ShieldGuideline } from '@/features/shield/components/ShieldGuideline';
import { s, isTablet } from '@/utils/scale';

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

  // Shield state — read from home feed cache, track locally for instant updates
  const shieldActive = useGameStore((s) => s.shieldActive);
  const activateShield = useGameStore((s) => s.activateShield);
  const cachedFeed = queryClient.getQueryData<{ userProgress?: { shields?: number } }>(['home', 'feed']);
  const serverShields = cachedFeed?.userProgress?.shields ?? 0;
  const [shieldOffset, setShieldOffset] = useState(0); // local adjustments (usage / reward)
  const shieldCount = Math.max(0, serverShields + shieldOffset);
  const [showShieldVideoModal, setShowShieldVideoModal] = useState(false);
  const [showShieldAbsorb, setShowShieldAbsorb] = useState(false);
  const [showShieldGuideline, setShowShieldGuideline] = useState(false);
  const hasSeenShieldGuideline = useAppStore((s) => s.hasSeenShieldGuideline);
  const markShieldGuidelineSeen = useAppStore((s) => s.markShieldGuidelineSeen);
  const hasSeenShieldIntro = useAppStore((s) => s.hasSeenShieldIntro);
  const markShieldIntroSeen = useAppStore((s) => s.markShieldIntroSeen);
  const [showShieldIntro, setShowShieldIntro] = useState(false);
  const prevStreakRef = useRef(currentStreak);

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
    } catch (err) {
      showToast(err instanceof Error ? err.message : t('error.generic'));
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
    lastShieldUsed,
  } = useCardGame(questions, dailySetId);

  const handleShieldPress = useCallback(() => {
    if (feedback || isSubmitting) return;
    if (shieldActive) return;
    if (shieldCount <= 0) {
      setShowShieldVideoModal(true);
      return;
    }
    activateShield();
  }, [feedback, isSubmitting, shieldActive, shieldCount, activateShield]);

  const handleShieldsEarned = useCallback((total: number) => {
    // total is the new server balance — compute offset from server cache
    setShieldOffset(total - serverShields);
  }, [serverShields]);

  const streakBonusPayload = useFeatureFlagPayload<{ tiers: { minStreak: number; bonusPercent: number }[] }>('streak_bonus');
  const isStreakBonusEnabled = useFeatureFlag('streak_bonus');
  const gameBonusPercent = isStreakBonusEnabled ? getStreakBonusPercent(liveStreak, streakBonusPayload?.tiers) : 0;

  // Shield absorb animation: trigger when feedback shows and shield was used
  useEffect(() => {
    if (feedback && lastShieldUsed) {
      setShowShieldAbsorb(true);
      setShieldOffset((prev) => prev - 1);
    }
  }, [feedback, lastShieldUsed]);

  // Shield guideline: show when streak was 0 and now > 0 for first time
  useEffect(() => {
    if (!hasSeenShieldGuideline && liveStreak > 0 && prevStreakRef.current === 0 && currentIndex > 0) {
      setShowShieldGuideline(true);
      markShieldGuidelineSeen();
    }
    prevStreakRef.current = liveStreak;
  }, [liveStreak, hasSeenShieldGuideline, markShieldGuidelineSeen, currentIndex]);

  // Shield intro: show once on first game when shield button appears
  useEffect(() => {
    if (!hasSeenShieldIntro && currentQuestion && currentIndex === 0 && !feedback) {
      const timer = setTimeout(() => {
        setShowShieldIntro(true);
        markShieldIntroSeen();
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [hasSeenShieldIntro, currentQuestion, currentIndex, feedback, markShieldIntroSeen]);

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

  // Pre-render data for explanation card (Android — avoids layout work during fly-in)
  const explanationText = currentQuestion
    ? (language === 'en' && currentQuestion.explanationEn ? currentQuestion.explanationEn : (currentQuestion.explanation ?? ''))
    : '';
  const sourceText = currentQuestion
    ? (language === 'en' && currentQuestion.sourceEn ? currentQuestion.sourceEn : (currentQuestion.source ?? ''))
    : '';
  const sourceUrlText = currentQuestion
    ? (language === 'en' && currentQuestion.sourceUrlEn ? currentQuestion.sourceUrlEn : (currentQuestion.sourceUrl ?? undefined))
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
            streak={liveStreak}
            onClose={() => setShowExitConfirm(true)}
            bonusPercent={gameBonusPercent}
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
            <View style={styles.shieldFloating}>
              <ShieldButton
                count={shieldCount}
                active={shieldActive}
                onPress={handleShieldPress}
                disabled={!!feedback || isSubmitting}
              />
            </View>
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
                explanation={explanationText}
                source={sourceText}
                sourceUrl={sourceUrlText ?? undefined}
                isTrue={currentQuestion?.isTrue}
                isFactOfDay={!isCollectionMode && !!dailyData?.factOfDayQuestionId && currentQuestion?.id === dailyData.factOfDayQuestionId}
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
        <AdBanner placement="game" size="LARGE" />
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
              style={[styles.modalButton, { backgroundColor: colors.primary, opacity: exitSaving ? 0.7 : 1 }]}
            >
              {exitSaving ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={[styles.modalButtonText, { color: '#FFFFFF' }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
                  {t('game.exitSave')}
                </Text>
              )}
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

      <ShieldAbsorbAnimation
        visible={showShieldAbsorb}
        gentle={!!(feedback && feedback.userAnsweredCorrectly)}
        onComplete={() => setShowShieldAbsorb(false)}
      />

      <ShieldWatchVideoModal
        visible={showShieldVideoModal}
        onClose={() => setShowShieldVideoModal(false)}
        onShieldsEarned={handleShieldsEarned}
      />

      <ShieldGuideline
        visible={showShieldGuideline}
        onClose={() => setShowShieldGuideline(false)}
      />

      {/* Shield intro — shown once on first ever game */}
      <OverlayModal visible={showShieldIntro} onClose={() => setShowShieldIntro(false)}>
        <View style={[styles.modalContent, { backgroundColor: colors.surface, borderRadius: 20 }]}>
          <MaterialCommunityIcons name="shield-outline" size={48} color="#3B82F6" />
          <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
            {t('shield.title')}
          </Text>
          <Text style={[styles.modalDesc, { color: colors.textSecondary }]}>
            {t('shield.description')}
          </Text>
          <Pressable
            onPress={() => setShowShieldIntro(false)}
            style={[styles.modalButton, { backgroundColor: colors.primary, flex: undefined, width: '100%' }]}
          >
            <Text style={[styles.modalButtonText, { color: '#FFFFFF' }]}>
              {t('shield.got')}
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
    paddingHorizontal: s(20),
  },
  cardArea: {
    flex: 1,
    justifyContent: 'center',
    paddingBottom: isTablet ? 0 : '30%',
  },
  counterRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: s(4),
    height: s(28),
    gap: s(8),
  },
  shieldFloating: {
    position: 'absolute',
    right: s(24),
    top: s(-8),
    zIndex: 10,
  },
  counterText: {
    fontSize: s(15),
    fontFamily: fontFamily.semiBold,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  undoButton: {
    width: s(30),
    height: s(30),
    borderRadius: s(15),
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonsRow: {
    paddingHorizontal: s(20),
    marginTop: s(24),
    height: s(56),
    ...(isTablet && { alignSelf: 'center', width: '60%' }),
  },
  buttonsContent: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: s(12),
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: s(8),
    paddingVertical: s(14),
    borderRadius: s(16),
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
    fontSize: s(17),
    fontFamily: fontFamily.bold,
  },
  actionButtonTextWhite: {
    fontSize: s(17),
    fontFamily: fontFamily.bold,
    color: '#FFFFFF',
  },
  modalContent: {
    width: '100%',
    padding: s(24),
    alignItems: 'center',
    gap: s(12),
  },
  modalTitle: {
    fontSize: s(20),
    fontFamily: fontFamily.bold,
    textAlign: 'center',
  },
  modalDesc: {
    fontSize: s(15),
    fontFamily: fontFamily.regular,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: s(12),
    marginTop: s(8),
    width: '100%',
  },
  modalButton: {
    flex: 1,
    paddingVertical: s(14),
    paddingHorizontal: s(6),
    borderRadius: s(12),
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: s(15),
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
    gap: s(8),
  },
  prevCardStatement: {
    fontSize: s(15),
    fontFamily: fontFamily.medium,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: s(22),
  },
  prevCardTruthBadge: {
    paddingHorizontal: s(14),
    paddingVertical: s(5),
    borderRadius: s(16),
  },
  prevCardTruthText: {
    fontSize: s(15),
    fontFamily: fontFamily.semiBold,
  },
  prevCardExplanation: {
    fontSize: s(15),
    fontFamily: fontFamily.regular,
    lineHeight: s(22),
    textAlign: 'center',
  },
  prevCardCloseBtn: {
    width: '100%',
    paddingVertical: s(14),
    borderRadius: s(12),
    alignItems: 'center',
    marginTop: s(4),
  },
});
