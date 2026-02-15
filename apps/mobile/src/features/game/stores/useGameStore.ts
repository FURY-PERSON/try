import { create } from 'zustand';
import type { GameResult, DailySetProgress } from '../types';

type GameStoreState = {
  dailyProgress: DailySetProgress;
  isPlaying: boolean;
  currentGameStartTime: number | null;

  startDailySet: (totalGames: number) => void;
  startGame: () => void;
  submitGameResult: (result: GameResult) => void;
  resetDailyProgress: () => void;
};

const initialProgress: DailySetProgress = {
  currentGameIndex: 0,
  totalGames: 5,
  results: [],
  completed: false,
};

export const useGameStore = create<GameStoreState>()((set, get) => ({
  dailyProgress: { ...initialProgress },
  isPlaying: false,
  currentGameStartTime: null,

  startDailySet: (totalGames: number) => {
    set({
      dailyProgress: {
        currentGameIndex: 0,
        totalGames,
        results: [],
        completed: false,
      },
      isPlaying: true,
    });
  },

  startGame: () => {
    set({ currentGameStartTime: Date.now() });
  },

  submitGameResult: (result: GameResult) => {
    const current = get().dailyProgress;
    const newResults = [...current.results, result];
    const newIndex = current.currentGameIndex + 1;
    const completed = newIndex >= current.totalGames;

    set({
      dailyProgress: {
        ...current,
        currentGameIndex: newIndex,
        results: newResults,
        completed,
      },
      isPlaying: !completed,
      currentGameStartTime: null,
    });
  },

  resetDailyProgress: () => {
    set({
      dailyProgress: { ...initialProgress },
      isPlaying: false,
      currentGameStartTime: null,
    });
  },
}));
