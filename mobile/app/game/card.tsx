import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
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

export default function CardScreen() {
  const router = useRouter();
  const streak = useUserStore((s) => s.currentStreak);
  const language = useSettingsStore((s) => s.language);
  const { data, isLoading, isError, error, refetch } = useDailySet();

  const questions = React.useMemo(() => {
    if (!data?.questions) return [];
    return [...data.questions].sort((a, b) => a.sortOrder - b.sortOrder);
  }, [data]);

  const dailySetId = data?.id ?? null;

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

  if (isLoading) {
    return (
      <Screen>
        <Skeleton width="100%" height={48} shape="rectangle" />
        <Skeleton width="100%" height={300} shape="card" style={{ marginTop: 32 }} />
      </Screen>
    );
  }

  if (isError) {
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
