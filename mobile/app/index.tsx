import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAppStore } from '@/stores/useAppStore';

export default function IndexScreen() {
  const router = useRouter();
  const hasCompletedOnboarding = useAppStore((s) => s.hasCompletedOnboarding);

  useEffect(() => {
    if (hasCompletedOnboarding) {
      router.replace('/(tabs)/home');
    } else {
      router.replace('/(onboarding)/step-1');
    }
  }, [hasCompletedOnboarding, router]);

  return null;
}
