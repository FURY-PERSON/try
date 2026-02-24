import React, { useEffect, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/layout/Screen';
import { GameHeader } from '@/features/game/components/GameHeader';
import { SwipeCard } from '@/features/game/components/SwipeCard';
import { ExplanationCard } from '@/features/game/components/ExplanationCard';
import { Skeleton } from '@/components/feedback/Skeleton';
import { ErrorState } from '@/components/feedback/ErrorState';
import { useDailySet } from '@/features/game/hooks/useDailySet';
import { useCardGame } from '@/features/game/hooks/useCardGame';
import { useUserStore } from '@/stores/useUserStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useGameStore } from '@/features/game/stores/useGameStore';
import type { DailySetQuestion } from '@/shared';

export default function CardScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ mode?: string }>();
  const streak = useUserStore((s) => s.currentStreak);
  const language = useSettingsStore((s) => s.language);
  const collectionType = useGameStore((s) => s.collectionType);
  const storedCollectionQuestions = useGameStore((s) => s.collectionQuestions);

  const isCollectionMode = params.mode === 'collection';

  // For collections, questions come from game store
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
      sortOrder: i + 1,
    }));
  }, [isCollectionMode, storedCollectionQuestions]);

  // For daily mode, fetch from API
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
    handleSwipe,
    handleNextCard,
  } = useCardGame(questions, dailySetId);

  useEffect(() => {
    if (isComplete && !feedback) {
      router.replace('/modal/results');
    }
  }, [isComplete, feedback, router]);

  // Loading state only for daily mode
  if (!isCollectionMode && isLoading) {
    return (
      <Screen>
        <Skeleton width="100%" height={48} shape="rectangle" />
        <Skeleton width="100%" height={300} shape="card" style={{ marginTop: 32 }} />
      </Screen>
    );
  }

  if (!isCollectionMode && isError) {
    return (
      <Screen>
        <ErrorState message={error?.message} onRetry={refetch} />
      </Screen>
    );
  }

  if (!currentQuestion && !feedback) {
    return (
      <Screen>
        <ErrorState message="No questions available" onRetry={refetch} />
      </Screen>
    );
  }

  const categoryName =
    currentQuestion?.category
      ? (language === 'en'
          ? currentQuestion.category.nameEn
          : currentQuestion.category.name)
      : '';

  return (
    <Screen>
      <GameHeader progress={progress} streak={streak} />

      <View style={styles.content}>
        {feedback ? (
          <ExplanationCard
            statement={feedback.statement}
            isTrue={feedback.isTrue}
            userAnsweredCorrectly={feedback.userAnsweredCorrectly}
            explanation={feedback.explanation}
            source={feedback.source}
            sourceUrl={feedback.sourceUrl}
            onNext={handleNextCard}
          />
        ) : currentQuestion ? (
          <SwipeCard
            statement={currentQuestion.statement}
            categoryName={categoryName}
            cardIndex={currentIndex}
            totalCards={totalCards}
            onSwipe={handleSwipe}
            disabled={isSubmitting}
          />
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    justifyContent: 'center',
  },
});
