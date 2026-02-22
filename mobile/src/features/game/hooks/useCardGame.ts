import { useState, useCallback, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useGameStore } from '../stores/useGameStore';
import { useUserStore } from '@/stores/useUserStore';
import { gameApi } from '../api/gameApi';
import { calculateCardScore } from '../utils';
import { analytics } from '@/services/analytics';
import type { DailySetQuestion } from '@/shared';
import type { SwipeDirection } from '../types';

type AnswerFeedback = {
  statement: string;
  isTrue: boolean;
  userAnsweredCorrectly: boolean;
  explanation: string;
  source: string;
  sourceUrl?: string;
};

export const useCardGame = (
  questions: DailySetQuestion[],
  dailySetId: string | null,
) => {
  const queryClient = useQueryClient();
  const { dailyProgress, startCard, submitCardResult, setSubmissionResult } =
    useGameStore();
  const {
    incrementCorrectAnswers,
    incrementFactsLearned,
    addScore,
    updateStreak,
    incrementGamesPlayed,
    setLastPlayedDate,
  } = useUserStore();
  const [feedback, setFeedback] = useState<AnswerFeedback | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentIndex = dailyProgress.currentCardIndex;
  const currentQuestion = questions[currentIndex];
  const isComplete = dailyProgress.completed;

  useEffect(() => {
    if (currentQuestion && !feedback) {
      startCard();
    }
  }, [currentIndex, currentQuestion, feedback, startCard]);

  const handleSwipe = useCallback(
    async (direction: SwipeDirection) => {
      if (!currentQuestion || isSubmitting || feedback) return;

      setIsSubmitting(true);
      const startTime =
        useGameStore.getState().currentCardStartTime ?? Date.now();
      const timeSpentMs = Date.now() - startTime;
      const timeSpentSeconds = Math.round(timeSpentMs / 1000);

      // right = user thinks it's fact (true), left = user thinks it's fake (false)
      const userAnswer = direction === 'right';

      try {
        const result = await gameApi.submitAnswer(
          currentQuestion.id,
          userAnswer,
          timeSpentSeconds,
        );

        const score = calculateCardScore(result.correct, timeSpentMs);

        setFeedback({
          statement: currentQuestion.statement,
          isTrue: result.isTrue,
          userAnsweredCorrectly: result.correct,
          explanation: result.explanation,
          source: result.source,
          sourceUrl: result.sourceUrl,
        });

        if (result.correct) {
          incrementCorrectAnswers();
          addScore(score);
        }
        incrementFactsLearned();

        submitCardResult({
          questionId: currentQuestion.id,
          correct: result.correct,
          score,
          timeSpentMs,
        });

        // Submit daily set when all cards are done
        const newProgress = useGameStore.getState().dailyProgress;
        if (newProgress.completed && dailySetId) {
          await submitDailySetResults(newProgress.results.map((r) => ({
            questionId: r.questionId,
            result: r.correct ? ('correct' as const) : ('incorrect' as const),
            timeSpentSeconds: Math.round(r.timeSpentMs / 1000),
          })));
        }

        analytics.logEvent('card_answered', {
          questionId: currentQuestion.id,
          correct: result.correct,
          timeSpentMs,
        });
      } catch {
        // Offline fallback: compute locally
        const isCorrect = userAnswer === currentQuestion.isTrue;
        const score = calculateCardScore(isCorrect, timeSpentMs);

        setFeedback({
          statement: currentQuestion.statement,
          isTrue: currentQuestion.isTrue,
          userAnsweredCorrectly: isCorrect,
          explanation: currentQuestion.explanation,
          source: currentQuestion.source,
          sourceUrl: currentQuestion.sourceUrl ?? undefined,
        });

        if (isCorrect) {
          incrementCorrectAnswers();
          addScore(score);
        }
        incrementFactsLearned();

        submitCardResult({
          questionId: currentQuestion.id,
          correct: isCorrect,
          score,
          timeSpentMs,
        });
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      currentQuestion,
      isSubmitting,
      feedback,
      dailySetId,
      submitCardResult,
      incrementCorrectAnswers,
      incrementFactsLearned,
      addScore,
      startCard,
    ],
  );

  const submitDailySetResults = useCallback(
    async (
      results: Array<{
        questionId: string;
        result: 'correct' | 'incorrect';
        timeSpentSeconds: number;
      }>,
    ) => {
      try {
        if (dailySetId) {
          const submission = await gameApi.submitDailySet(dailySetId, results);
          setSubmissionResult(submission);
          updateStreak(submission.streak);
        }
        incrementGamesPlayed();
        setLastPlayedDate(new Date().toISOString().split('T')[0]);
      } catch {
        // Silently fail — results modal will show without percentile
        console.warn('Failed to submit daily set');
        incrementGamesPlayed();
        setLastPlayedDate(new Date().toISOString().split('T')[0]);
      } finally {
        // Invalidate cached queries so profile stats and leaderboard refresh
        queryClient.invalidateQueries({ queryKey: ['user', 'stats'] });
        queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
      }
    },
    [dailySetId, setSubmissionResult, updateStreak, incrementGamesPlayed, setLastPlayedDate],
  );

  const handleNextCard = useCallback(() => {
    setFeedback(null);
  }, []);

  return {
    currentQuestion,
    currentIndex,
    totalCards: dailyProgress.totalCards,
    feedback,
    isSubmitting,
    isComplete,
    progress: currentIndex / dailyProgress.totalCards,
    handleSwipe,
    handleNextCard,
  };
};
