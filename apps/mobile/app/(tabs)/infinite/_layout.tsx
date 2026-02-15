import React from 'react';
import { Stack } from 'expo-router';

export default function InfiniteLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
