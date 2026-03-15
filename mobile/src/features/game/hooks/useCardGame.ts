import { useState, useCallback, useEffect, useRef } from 'react';
import { InteractionManager } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { useGameStore } from '../stores/useGameStore';
import { gameApi } from '../api/gameApi';
import { collectionsApi } from '@/features/collections/api/collectionsApi';
import { calculateCardScore } from '../utils';
import { analytics } from '@/services/analytics';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useAdsStore } from '@/stores/useAdsStore';
import type { DailySetQuestion } from '@/shared';
import type { CardResult, SwipeDirection } from '../types';

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
  const language = useSettingsStore((s) => s.language);
  const dailyProgress = useGameStore((s) => s.dailyProgress);
  const startCard = useGameStore((s) => s.startCard);
  const submitCardResult = useGameStore((s) => s.submitCardResult);
  const setSubmissionResult = useGameStore((s) => s.setSubmissionResult);
  const sessionId = useGameStore((s) => s.sessionId);
  const collectionType = useGameStore((s) => s.collectionType);
  const isReplay = useGameStore((s) => s.isReplay);
  const [feedback, setFeedback] = useState<AnswerFeedback | null>(null);
  const feedbackRef = useRef<AnswerFeedback | null>(null);
  const [previousFeedback, setPreviousFeedback] = useState<AnswerFeedback | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSubmittingRef = useRef(false);
  const currentStreak = useGameStore((s) => s.currentStreak);
  const [liveStreak, setLiveStreak] = useState(currentStreak);
  const [pendingResult, setPendingResult] = useState<CardResult | null>(null);
  const savedProgressIds = useRef<Set<string>>(new Set());
  const savedProgressSessionRef = useRef(sessionId);
  const addFactsAnswered = useAdsStore((s) => s.addFactsAnswered);
  const factsAnsweredInSessionRef = useRef(0);

  // Reset tracked IDs when session changes
  if (savedProgressSessionRef.current !== sessionId) {
    savedProgressIds.current = new Set();
    savedProgressSessionRef.current = sessionId;
  }

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
      // Use refs for guard checks to avoid recreating this callback on every
      // feedback/isSubmitting state change — reduces re-renders during animations
      if (!currentQuestion || isSubmittingRef.current || feedbackRef.current) return;

      setIsSubmitting(true);
      isSubmittingRef.current = true;
      const startTime =
        useGameStore.getState().currentCardStartTime ?? Date.now();
      const timeSpentMs = Date.now() - startTime;
      const timeSpentSeconds = Math.round(timeSpentMs / 1000);

      // right = user thinks it's fact (true), left = user thinks it's fake (false)
      const userAnswer = direction === 'right';
      let answeredCorrectly = false;

      try {
        // Check answer locally for instant feedback — no waiting for server
        const isCorrect = userAnswer === currentQuestion.isTrue;
        const score = calculateCardScore(isCorrect, timeSpentMs);
        answeredCorrectly = isCorrect;

        const resolvedStatement = language === 'en' && currentQuestion.statementEn
          ? currentQuestion.statementEn : currentQuestion.statement;
        const resolvedExplanation = language === 'en' && currentQuestion.explanationEn
          ? currentQuestion.explanationEn : (currentQuestion.explanation ?? '');
        const resolvedSource = language === 'en' && currentQuestion.sourceEn
          ? currentQuestion.sourceEn : (currentQuestion.source ?? '');
        const resolvedSourceUrl = language === 'en' && currentQuestion.sourceUrlEn
          ? currentQuestion.sourceUrlEn : (currentQuestion.sourceUrl ?? undefined);

        const newFeedback = {
          statement: resolvedStatement,
          isTrue: currentQuestion.isTrue,
          userAnsweredCorrectly: isCorrect,
          explanation: resolvedExplanation,
          source: resolvedSource,
          sourceUrl: resolvedSourceUrl,
        };
        feedbackRef.current = newFeedback;
        setFeedback(newFeedback);

        setPendingResult({
          questionId: currentQuestion.id,
          correct: isCorrect,
          score,
          timeSpentMs,
        });

        // For daily sets: fire-and-forget per-question submit for server-side tracking.
        // The full result set is re-submitted via submitDailySet() at the end anyway.
        if (collectionType === 'daily') {
          gameApi.submitAnswer(currentQuestion.id, userAnswer, timeSpentSeconds).catch(() => {
            // Silent — included in final submitDailySet()
          });
        }

        // Update live streak based on answer
        setLiveStreak((prev) => (answeredCorrectly ? prev + 1 : 0));

        // Defer analytics so JS thread is free during flip animation
        const analyticsData = {
          questionId: currentQuestion.id,
          correct: answeredCorrectly,
          timeSpentMs,
          collectionType,
        };
        InteractionManager.runAfterInteractions(() => {
          analytics.logEvent('card_answered', analyticsData);
        });
      } catch {
        // Offline fallback: compute locally
        const isCorrect = userAnswer === currentQuestion.isTrue;
        const score = calculateCardScore(isCorrect, timeSpentMs);

        const fbStatement = language === 'en' && currentQuestion.statementEn
          ? currentQuestion.statementEn : currentQuestion.statement;
        const fbExplanation = language === 'en' && currentQuestion.explanationEn
          ? currentQuestion.explanationEn : (currentQuestion.explanation ?? '');

        const fbSource = language === 'en' && currentQuestion.sourceEn
          ? currentQuestion.sourceEn : (currentQuestion.source ?? '');
        const fbSourceUrl = language === 'en' && currentQuestion.sourceUrlEn
          ? currentQuestion.sourceUrlEn : (currentQuestion.sourceUrl ?? undefined);

        const newFeedback = {
          statement: fbStatement,
          isTrue: currentQuestion.isTrue,
          userAnsweredCorrectly: isCorrect,
          explanation: fbExplanation,
          source: fbSource,
          sourceUrl: fbSourceUrl,
        };
        feedbackRef.current = newFeedback;
        setFeedback(newFeedback);

        setPendingResult({
          questionId: currentQuestion.id,
          correct: isCorrect,
          score,
          timeSpentMs,
        });
      } finally {
        setIsSubmitting(false);
        isSubmittingRef.current = false;
      }
    },
    [
      currentQuestion,
      collectionType,
      language,
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
    if (pendingResult) {
      // Store current feedback as previous before clearing
      setPreviousFeedback(feedback);
      // Clear feedback BEFORE advancing index to prevent stale content flash
      feedbackRef.current = null;
      setFeedback(null);
      setPendingResult(null);
      submitCardResult(pendingResult);

      // Increment facts counter every 3 answers so progress is persisted mid-game
      factsAnsweredInSessionRef.current += 1;
      if (factsAnsweredInSessionRef.current % 3 === 0) {
        addFactsAnswered(3);
      }

      // Read progress immediately after submitCardResult (synchronous Zustand update),
      // BEFORE any async work — prevents race condition where resetDailyProgress() can
      // clear the store while we're awaiting network calls.
      const newProgress = useGameStore.getState().dailyProgress;
      const currentIsReplay = useGameStore.getState().isReplay;
      const needsFinalSubmit = newProgress.completed && !currentIsReplay;
      const finalResults = needsFinalSubmit
        ? newProgress.results.map((r) => ({
            questionId: r.questionId,
            result: r.correct ? ('correct' as const) : ('incorrect' as const),
            timeSpentSeconds: Math.round(r.timeSpentMs / 1000),
          }))
        : null;

      // Fire-and-forget: save individual answer progress for collection modes.
      // Does NOT block the JS thread — the card transition happens immediately.
      if (
        collectionType !== 'daily' &&
        !isReplay &&
        sessionId &&
        !savedProgressIds.current.has(pendingResult.questionId)
      ) {
        const progressResult = {
          questionId: pendingResult.questionId,
          result: pendingResult.correct
            ? ('correct' as const)
            : ('incorrect' as const),
          timeSpentSeconds: Math.round(pendingResult.timeSpentMs / 1000),
        };
        const capturedQuestionId = pendingResult.questionId;
        collectionsApi.saveProgress(sessionId, [progressResult])
          .then(() => { savedProgressIds.current.add(capturedQuestionId); })
          .catch(() => {
            // Answer will be included in final submit()
            console.warn('Failed to save progress for', capturedQuestionId);
          });
      }

      // Fire-and-forget: submit full set when all cards are done (skip for replays).
      // The results screen navigation is driven by isComplete state, not by this await.
      if (finalResults) {
        if (collectionType === 'daily' && dailySetId) {
          submitDailySetResults(finalResults);
        } else if (sessionId) {
          submitCollectionResults(finalResults);
        }
      }
    } else {
      setFeedback(null);
    }
  }, [pendingResult, feedback, submitCardResult, collectionType, dailySetId, sessionId, isReplay, submitDailySetResults, submitCollectionResults]);

  return {
    currentQuestion,
    currentIndex,
    totalCards: dailyProgress.totalCards,
    feedback,
    previousFeedback,
    isSubmitting,
    isComplete,
    progress: currentIndex / dailyProgress.totalCards,
    liveStreak,
    handleSwipe,
    handleNextCard,
  };
};
