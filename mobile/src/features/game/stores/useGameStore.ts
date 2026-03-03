import { create } from 'zustand';
import { CARDS_PER_DAILY_SET } from '@/shared';
import type { CollectionSessionQuestion } from '@/shared';
import type { CardResult, DailySetProgress, SubmissionResult } from '../types';

export type CollectionType = 'daily' | 'category' | 'difficulty' | 'collection';

type GameStoreState = {
  dailyProgress: DailySetProgress;
  isPlaying: boolean;
  currentCardStartTime: number | null;
  submissionResult: SubmissionResult | null;

  // Current server streak (passed from home screen on game start)
  currentStreak: number;

  // Collection session tracking
  sessionId: string | null;
  collectionType: CollectionType;
  collectionQuestions: CollectionSessionQuestion[];
  isReplay: boolean;

  startDailySet: (dailySetId: string | null, totalCards: number, streak?: number, resumeFromIndex?: number, previousResults?: CardResult[]) => void;
  startCollectionSession: (
    sessionId: string,
    collectionType: CollectionType,
    totalCards: number,
    questions: CollectionSessionQuestion[],
    isReplay?: boolean,
    streak?: number,
  ) => void;
  startCard: () => void;
  submitCardResult: (result: CardResult) => void;
  setTotalCards: (total: number) => void;
  setSubmissionResult: (result: SubmissionResult) => void;
  resetDailyProgress: () => void;
};

const initialProgress: DailySetProgress = {
  dailySetId: null,
  currentCardIndex: 0,
  totalCards: CARDS_PER_DAILY_SET,
  results: [],
  completed: false,
};

export const useGameStore = create<GameStoreState>()((set, get) => ({
  dailyProgress: { ...initialProgress },
  isPlaying: false,
  currentCardStartTime: null,
  submissionResult: null,
  currentStreak: 0,
  sessionId: null,
  collectionType: 'daily' as CollectionType,
  collectionQuestions: [],
  isReplay: false,

  startDailySet: (dailySetId: string | null, totalCards: number, streak?: number, resumeFromIndex?: number, previousResults?: CardResult[]) => {
    set({
      dailyProgress: {
        dailySetId,
        currentCardIndex: resumeFromIndex ?? 0,
        totalCards,
        results: previousResults ?? [],
        completed: false,
      },
      isPlaying: true,
      submissionResult: null,
      currentStreak: streak ?? get().currentStreak,
      sessionId: null,
      collectionType: 'daily',
      collectionQuestions: [],
      isReplay: false,
    });
  },

  startCollectionSession: (
    sessionId: string,
    collectionType: CollectionType,
    totalCards: number,
    questions: CollectionSessionQuestion[],
    isReplay?: boolean,
    streak?: number,
  ) => {
    set({
      dailyProgress: {
        dailySetId: null,
        currentCardIndex: 0,
        totalCards,
        results: [],
        completed: false,
      },
      isPlaying: true,
      submissionResult: null,
      currentStreak: streak ?? get().currentStreak,
      sessionId,
      collectionType,
      collectionQuestions: questions,
      isReplay: isReplay ?? false,
    });
  },

  startCard: () => {
    set({ currentCardStartTime: Date.now() });
  },

  submitCardResult: (result: CardResult) => {
    const current = get().dailyProgress;
    const newResults = [...current.results, result];
    const newIndex = current.currentCardIndex + 1;
    const completed = newIndex >= current.totalCards;

    set({
      dailyProgress: {
        ...current,
        currentCardIndex: newIndex,
        results: newResults,
        completed,
      },
      isPlaying: !completed,
      currentCardStartTime: null,
    });
  },

  setTotalCards: (total: number) => {
    const current = get().dailyProgress;
    set({
      dailyProgress: {
        ...current,
        totalCards: total,
      },
    });
  },

  setSubmissionResult: (result: SubmissionResult) => {
    set({ submissionResult: result });
  },

  resetDailyProgress: () => {
    set({
      dailyProgress: { ...initialProgress },
      isPlaying: false,
      currentCardStartTime: null,
      submissionResult: null,
      currentStreak: 0,
      sessionId: null,
      collectionType: 'daily',
      collectionQuestions: [],
      isReplay: false,
    });
  },
}));
