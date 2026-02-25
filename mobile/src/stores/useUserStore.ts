import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

type UserState = {
  nickname: string | null;
  avatarEmoji: string | null;
  currentStreak: number;
  longestStreak: number;
  totalScore: number;
  totalGamesPlayed: number;
  totalCorrectAnswers: number;
  factsLearned: number;
  lastPlayedDate: string | null;

  setNickname: (nickname: string) => void;
  setAvatarEmoji: (emoji: string) => void;
  updateStreak: (streak: number) => void;
  addScore: (score: number) => void;
  incrementGamesPlayed: () => void;
  incrementCorrectAnswers: () => void;
  incrementFactsLearned: () => void;
  setLastPlayedDate: (date: string) => void;
  resetStats: () => void;
};

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      nickname: null,
      avatarEmoji: null,
      currentStreak: 0,
      longestStreak: 0,
      totalScore: 0,
      totalGamesPlayed: 0,
      totalCorrectAnswers: 0,
      factsLearned: 0,
      lastPlayedDate: null,

      setNickname: (nickname: string) => {
        set({ nickname });
      },

      setAvatarEmoji: (emoji: string) => {
        set({ avatarEmoji: emoji });
      },

      updateStreak: (streak: number) => {
        const current = get();
        set({
          currentStreak: streak,
          longestStreak: Math.max(current.longestStreak, streak),
        });
      },

      addScore: (score: number) => {
        set((state) => ({ totalScore: state.totalScore + score }));
      },

      incrementGamesPlayed: () => {
        set((state) => ({ totalGamesPlayed: state.totalGamesPlayed + 1 }));
      },

      incrementCorrectAnswers: () => {
        set((state) => ({ totalCorrectAnswers: state.totalCorrectAnswers + 1 }));
      },

      incrementFactsLearned: () => {
        set((state) => ({ factsLearned: state.factsLearned + 1 }));
      },

      setLastPlayedDate: (date: string) => {
        set({ lastPlayedDate: date });
      },

      resetStats: () => {
        set({
          currentStreak: 0,
          longestStreak: 0,
          totalScore: 0,
          totalGamesPlayed: 0,
          totalCorrectAnswers: 0,
          factsLearned: 0,
          lastPlayedDate: null,
        });
      },
    }),
    {
      name: 'factorfake-user-store',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
