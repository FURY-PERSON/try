import { Redirect } from 'expo-router';
import { useAppStore } from '@/stores/useAppStore';

export default function IndexScreen() {
  const hasCompletedOnboarding = useAppStore((s) => s.hasCompletedOnboarding);

  if (hasCompletedOnboarding) {
    return <Redirect href="/(tabs)/home" />;
  }

  return <Redirect href="/(onboarding)/step-1" />;
}
