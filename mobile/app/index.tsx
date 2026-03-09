import { Redirect } from 'expo-router';
import { useAppStore } from '@/stores/useAppStore';

export default function IndexScreen() {
  // TODO: remove override — temporarily force onboarding for testing
  const hasCompletedOnboarding = useAppStore((s) => s.hasCompletedOnboarding); 

  if (hasCompletedOnboarding) {
    return <Redirect href="/(tabs)/home" />;
  }

  return <Redirect href="/(onboarding)/step-1" />;
}
