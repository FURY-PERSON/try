export type AppScreen =
  | 'home'
  | 'infinite'
  | 'leaderboard'
  | 'profile'
  | 'settings'
  | 'game'
  | 'onboarding';

export type GameType = 'anagram' | 'compose' | 'chain' | 'search' | 'guess';

export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export type NetworkStatus = 'online' | 'offline' | 'unknown';
