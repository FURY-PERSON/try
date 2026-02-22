import { create } from 'zustand';
import { CARDS_PER_DAILY_SET } from '@/shared';
import type { CardResult, DailySetProgress, SubmissionResult } from '../types';

type GameStoreState = {
  dailyProgress: DailySetProgress;
  isPlaying: boolean;
  currentCardStartTime: number | null;
  submissionResult: SubmissionResult | null;

  startDailySet: (dailySetId: string | null, totalCards: number) => void;
  startCard: () => void;
  submitCardResult: (result: CardResult) => void;
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

  startDailySet: (dailySetId: string | null, totalCards: number) => {
    set({
      dailyProgress: {
        dailySetId,
        currentCardIndex: 0,
        totalCards,
        results: [],
        completed: false,
      },
      isPlaying: true,
      submissionResult: null,
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

  setSubmissionResult: (result: SubmissionResult) => {
    set({ submissionResult: result });
  },

  resetDailyProgress: () => {
    set({
      dailyProgress: { ...initialProgress },
      isPlaying: false,
      currentCardStartTime: null,
      submissionResult: null,
    });
  },
}));
