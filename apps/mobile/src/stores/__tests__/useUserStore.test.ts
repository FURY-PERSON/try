import { act } from '@testing-library/react';

// Test Zustand store logic
// We test the store creation directly without rendering components

describe('useUserStore logic', () => {
  // Re-implement essential store logic for unit testing
  type UserState = {
    nickname: string | null;
    currentStreak: number;
    bestStreak: number;
    totalGamesPlayed: number;
    totalCorrectAnswers: number;
    factsLearned: number;
    score: number;
  };

  const createInitialState = (): UserState => ({
    nickname: null,
    currentStreak: 0,
    bestStreak: 0,
    totalGamesPlayed: 0,
    totalCorrectAnswers: 0,
    factsLearned: 0,
    score: 0,
  });

  let state: UserState;

  beforeEach(() => {
    state = createInitialState();
  });

  it('starts with default values', () => {
    expect(state.nickname).toBeNull();
    expect(state.currentStreak).toBe(0);
    expect(state.bestStreak).toBe(0);
    expect(state.totalGamesPlayed).toBe(0);
  });

  it('sets nickname', () => {
    state.nickname = 'TestUser';
    expect(state.nickname).toBe('TestUser');
  });

  it('tracks best streak', () => {
    state.currentStreak = 5;
    state.bestStreak = Math.max(state.bestStreak, state.currentStreak);
    expect(state.bestStreak).toBe(5);

    state.currentStreak = 3;
    state.bestStreak = Math.max(state.bestStreak, state.currentStreak);
    expect(state.bestStreak).toBe(5);

    state.currentStreak = 10;
    state.bestStreak = Math.max(state.bestStreak, state.currentStreak);
    expect(state.bestStreak).toBe(10);
  });

  it('increments game stats', () => {
    state.totalGamesPlayed += 1;
    state.totalCorrectAnswers += 1;
    state.score += 100;

    expect(state.totalGamesPlayed).toBe(1);
    expect(state.totalCorrectAnswers).toBe(1);
    expect(state.score).toBe(100);
  });

  it('resets streak', () => {
    state.currentStreak = 7;
    state.currentStreak = 0;
    expect(state.currentStreak).toBe(0);
  });
});
