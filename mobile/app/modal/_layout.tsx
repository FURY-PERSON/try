import React from 'react';
import { Platform } from 'react-native';
import { Stack } from 'expo-router';

export default function ModalLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        presentation: Platform.OS === 'ios' ? 'modal' : 'fullScreenModal',
        animation: 'slide_from_bottom',
      }}
    />
  );
}
