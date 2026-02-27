import { useState, useCallback, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useGameStore } from '../stores/useGameStore';
import { gameApi } from '../api/gameApi';
import { collectionsApi } from '@/features/collections/api/collectionsApi';
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
  const {
    dailyProgress,
    startCard,
    submitCardResult,
    setSubmissionResult,
    sessionId,
    collectionType,
  } = useGameStore();
  const [feedback, setFeedback] = useState<AnswerFeedback | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [liveStreak, setLiveStreak] = useState(0);

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
      let answeredCorrectly = false;

      try {
        // For daily sets, submit individual answers to server
        // For collections, use local question data (isTrue is not sent by server)
        if (collectionType === 'daily') {
          const result = await gameApi.submitAnswer(
            currentQuestion.id,
            userAnswer,
            timeSpentSeconds,
          );

          const score = calculateCardScore(result.correct, timeSpentMs);
          answeredCorrectly = result.correct;

          setFeedback({
            statement: currentQuestion.statement,
            isTrue: result.isTrue,
            userAnsweredCorrectly: result.correct,
            explanation: result.explanation,
            source: result.source,
            sourceUrl: result.sourceUrl,
          });

          submitCardResult({
            questionId: currentQuestion.id,
            correct: result.correct,
            score,
            timeSpentMs,
          });
        } else {
          // Collection mode — check answer locally
          const isCorrect = userAnswer === currentQuestion.isTrue;
          const score = calculateCardScore(isCorrect, timeSpentMs);
          answeredCorrectly = isCorrect;

          setFeedback({
            statement: currentQuestion.statement,
            isTrue: currentQuestion.isTrue,
            userAnsweredCorrectly: isCorrect,
            explanation: currentQuestion.explanation ?? '',
            source: currentQuestion.source ?? '',
            sourceUrl: currentQuestion.sourceUrl ?? undefined,
          });

          submitCardResult({
            questionId: currentQuestion.id,
            correct: isCorrect,
            score,
            timeSpentMs,
          });
        }

        // Submit full set when all cards are done
        const newProgress = useGameStore.getState().dailyProgress;
        if (newProgress.completed) {
          const gameResults = newProgress.results.map((r) => ({
            questionId: r.questionId,
            result: r.correct ? ('correct' as const) : ('incorrect' as const),
            timeSpentSeconds: Math.round(r.timeSpentMs / 1000),
          }));

          if (collectionType === 'daily' && dailySetId) {
            await submitDailySetResults(gameResults);
          } else if (sessionId) {
            await submitCollectionResults(gameResults);
          }
        }

        // Update live streak based on answer
        setLiveStreak((prev) => (answeredCorrectly ? prev + 1 : 0));

        analytics.logEvent('card_answered', {
          questionId: currentQuestion.id,
          correct: answeredCorrectly,
          timeSpentMs,
          collectionType,
        });
      } catch {
        // Offline fallback: compute locally
        const isCorrect = userAnswer === currentQuestion.isTrue;
        const score = calculateCardScore(isCorrect, timeSpentMs);

        setFeedback({
          statement: currentQuestion.statement,
          isTrue: currentQuestion.isTrue,
          userAnsweredCorrectly: isCorrect,
          explanation: currentQuestion.explanation ?? '',
          source: currentQuestion.source ?? '',
          sourceUrl: currentQuestion.sourceUrl ?? undefined,
        });

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
      sessionId,
      collectionType,
      submitCardResult,
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
        }
      } catch {
        console.warn('Failed to submit daily set');
      } finally {
        queryClient.invalidateQueries({ queryKey: ['user', 'stats'] });
        queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
        queryClient.invalidateQueries({ queryKey: ['home', 'feed'] });
      }
    },
    [dailySetId, setSubmissionResult],
  );

  const submitCollectionResults = useCallback(
    async (
      results: Array<{
        questionId: string;
        result: 'correct' | 'incorrect';
        timeSpentSeconds: number;
      }>,
    ) => {
      try {
        if (sessionId) {
          const submission = await collectionsApi.submit(sessionId, results);
          // Map to SubmissionResult format (no leaderboard data for collections)
          setSubmissionResult({
            score: submission.score,
            correctAnswers: submission.correctAnswers,
            totalQuestions: submission.totalQuestions,
            totalTimeSeconds: submission.totalTimeSeconds,
            streak: submission.streak ?? 0,
            bestStreak: submission.bestStreak ?? 0,
            leaderboardPosition: 0,
            correctPercent: Math.round(
              (submission.correctAnswers / submission.totalQuestions) * 100,
            ),
            percentile: 0,
            totalPlayers: 0,
          });
        }
      } catch {
        console.warn('Failed to submit collection');
      } finally {
        queryClient.invalidateQueries({ queryKey: ['user', 'stats'] });
        queryClient.invalidateQueries({ queryKey: ['home', 'feed'] });
        queryClient.invalidateQueries({ queryKey: ['category'] });
        queryClient.invalidateQueries({ queryKey: ['collection'] });
      }
    },
    [sessionId, setSubmissionResult],
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
    liveStreak,
    handleSwipe,
    handleNextCard,
  };
};
