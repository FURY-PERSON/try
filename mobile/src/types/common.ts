export type AppScreen =
  | 'home'
  | 'leaderboard'
  | 'profile'
  | 'settings'
  | 'game'
  | 'onboarding';

export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export type NetworkStatus = 'online' | 'offline' | 'unknown';
