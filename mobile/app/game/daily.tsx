import React, { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useGameStore } from '@/features/game/stores/useGameStore';

export default function DailyScreen() {
  const router = useRouter();
  const dailyProgress = useGameStore((s) => s.dailyProgress);

  useEffect(() => {
    if (dailyProgress.completed) {
      router.replace('/modal/results');
    } else {
      router.replace('/game/card');
    }
  }, [dailyProgress.completed, router]);

  return null;
}
