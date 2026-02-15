import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import type { AppStateStatus } from 'react-native';

type AppStateCallback = (state: AppStateStatus) => void;

export const useAppState = (onForeground?: AppStateCallback, onBackground?: AppStateCallback) => {
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        onForeground?.(nextAppState);
      }

      if (appState.current === 'active' && nextAppState.match(/inactive|background/)) {
        onBackground?.(nextAppState);
      }

      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [onForeground, onBackground]);
};
