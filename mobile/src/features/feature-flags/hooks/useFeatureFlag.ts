import { useFeatureFlagsStore } from '@/stores/useFeatureFlagsStore';

export function useFeatureFlag(key: string, defaultValue = false): boolean {
  return useFeatureFlagsStore((s) => s.isEnabled(key, defaultValue));
}

export function useFeatureFlagPayload<T = Record<string, unknown>>(
  key: string,
): T | null {
  return useFeatureFlagsStore((s) => s.getPayload<T>(key));
}
