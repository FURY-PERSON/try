import React from 'react';
import { BackHandler, Platform } from 'react-native';
import { Stack, usePathname } from 'expo-router';
import { useEffect } from 'react';

export default function GameLayout() {
  const pathname = usePathname();

  // Block Android hardware back button inside game screens
  useEffect(() => {
    if (Platform.OS !== 'android') return;

    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      // Return true = we handled it (prevent default back)
      return true;
    });

    return () => subscription.remove();
  }, [pathname]);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        gestureEnabled: false, // Block iOS swipe-back gesture
      }}
    />
  );
}
