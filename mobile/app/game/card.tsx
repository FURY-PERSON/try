import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { OverlayModal } from '@/components/feedback/OverlayModal';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Screen } from '@/components/layout/Screen';
import { Button } from '@/components/ui/Button';
import { GameHeader } from '@/features/game/components/GameHeader';
import { FlipSwipeCard } from '@/features/game/components/FlipSwipeCard';
import { Skeleton } from '@/components/feedback/Skeleton';
import { ErrorState } from '@/components/feedback/ErrorState';
import { useDailySet } from '@/features/game/hooks/useDailySet';
import { useCardGame } from '@/features/game/hooks/useCardGame';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useGameStore } from '@/features/game/stores/useGameStore';
import { collectionsApi } from '@/features/collections/api/collectionsApi';
import { useThemeContext } from '@/theme';
import { fontFamily } from '@/theme/typography';
import type { DailySetQuestion } from '@/shared';

export default function CardScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ mode?: string }>();
  // streak from store used only as initial value; liveStreak from hook tracks per-answer
  const language = useSettingsStore((s) => s.language);
  const collectionType = useGameStore((s) => s.collectionType);
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

  const handleExitWithSave = useCallback(async () => {
    if (!sessionId || exitSaving) return;
    setExitSaving(true);
    try {
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
    } catch {
      setShowExitConfirm(false);
      router.replace('/(tabs)/home');
    } finally {
      setExitSaving(false);
    }
  }, [sessionId, exitSaving, dailyProgress.results, setTotalCards, setSubmissionResult, router]);

  const collectionQuestions: DailySetQuestion[] = useMemo(() => {
    if (!isCollectionMode || storedCollectionQuestions.length === 0) return [];
    return storedCollectionQuestions.map((q, i) => ({
      id: q.id,
      statement: q.statement ?? '',
      isTrue: q.isTrue ?? false,
      explanation: q.explanation ?? '',
      source: q.source ?? '',
      sourceUrl: q.sourceUrl ?? null,
      language: q.language ?? 'ru',
      categoryId: q.categoryId ?? '',
      difficulty: q.difficulty ?? 3,
      illustrationUrl: q.illustrationUrl ?? null,
      category: q.category,
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

  useEffect(() => {
    if (isComplete && !feedback) {
      router.replace('/modal/results');
    }
  }, [isComplete, feedback, router]);

  // Next question for stack preview
  const nextQuestion = questions[currentIndex + 1] ?? null;
  const nextCategoryName = nextQuestion?.category
    ? (language === 'en' ? (nextQuestion.category.nameEn || nextQuestion.category.name) : nextQuestion.category.name)
    : '';

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

  return (
    <Screen padded={false} backgroundColor={gradients.card[0]}>
      <LinearGradient
        colors={gradients.card}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.gradient}
      >
        <View style={[styles.padded, { paddingTop: insets.top }]}>
          <GameHeader
            progress={progress}
            streak={liveStreak}
            onClose={isCollectionMode ? () => setShowExitConfirm(true) : undefined}
          />
        </View>

        <Text style={[styles.counterText, { color: colors.textTertiary }]}>
          {currentIndex + 1} / {totalCards}
        </Text>

        {!feedback && currentQuestion && (
          <View style={styles.swipeHints}>
            <View style={[styles.hintBadge, { backgroundColor: colors.red + '10', borderWidth: 1, borderColor: colors.red + '20' }]}>
              <Text style={[styles.hintText, { color: colors.red }]}>
                ← {t('game.fake')}
              </Text>
            </View>
            <Text style={[styles.hintCenter, { color: colors.textTertiary }]}>
              {t('game.swipeHint')}
            </Text>
            <View style={[styles.hintBadge, { backgroundColor: colors.emerald + '10', borderWidth: 1, borderColor: colors.emerald + '20' }]}>
              <Text style={[styles.hintText, { color: colors.emerald }]}>
                {t('game.fact')} →
              </Text>
            </View>
          </View>
        )}

        {currentQuestion ? (
          <>
            <View style={styles.cardArea}>
              <View style={styles.padded}>
                <FlipSwipeCard
                  key={currentIndex}
                  statement={currentQuestion.statement}
                  categoryName={categoryName}
                  cardIndex={currentIndex}
                  totalCards={totalCards}
                  feedback={feedback}
                  onSwipe={handleSwipe}
                  onDismiss={handleNextCard}
                  disabled={isSubmitting}
                  isSubmitting={isSubmitting}
                  nextStatement={nextQuestion?.statement}
                  nextCategoryName={nextCategoryName}
                />
              </View>
            </View>

            {feedback && (
              <View style={[styles.bottomButton, { paddingBottom: 16 + insets.bottom }]}>
                <Button
                  label={`${t('common.next')} →`}
                  variant={feedback.userAnsweredCorrectly ? 'success' : 'primary'}
                  size="lg"
                  onPress={handleNextCard}
                />
              </View>
            )}
          </>
        ) : null}
      </LinearGradient>

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
              <Text style={[styles.modalButtonText, { color: colors.textPrimary }]}>
                {t('common.cancel')}
              </Text>
            </Pressable>
            <Pressable
              onPress={handleExitWithSave}
              disabled={exitSaving}
              style={[styles.modalButton, { backgroundColor: colors.primary }]}
            >
              <Text style={[styles.modalButtonText, { color: '#FFFFFF' }]}>
                {t('game.exitSave')}
              </Text>
            </Pressable>
          </View>
        </View>
      </OverlayModal>
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
  },
  bottomButton: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  counterText: {
    fontSize: 15,
    fontFamily: fontFamily.semiBold,
    textAlign: 'center',
    marginTop: 4,
    letterSpacing: 0.5,
  },
  swipeHints: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
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
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 15,
    fontFamily: fontFamily.semiBold,
  },
});
