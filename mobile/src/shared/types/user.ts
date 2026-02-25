import type { UserLanguagePreference } from '../constants/languages';

export type User = {
  id: string;
  deviceId: string;
  nickname: string | null;
  avatarEmoji: string | null;
  language: UserLanguagePreference;
  pushToken: string | null;
  pushEnabled: boolean;
  currentStreak: number;
  bestStreak: number;
  lastPlayedDate: string | null;
  totalGamesPlayed: number;
  totalCorrectAnswers: number;
  createdAt: string;
  updatedAt: string;
};

export type UserStats = {
  totalGamesPlayed: number;
  totalCorrectAnswers: number;
  correctPercentage: number;
  currentStreak: number;
  bestStreak: number;
  factsLearned: number;
  averageDailyScore: number;
};
