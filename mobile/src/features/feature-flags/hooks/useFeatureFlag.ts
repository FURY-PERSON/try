import { useFeatureFlagsStore } from '@/stores/useFeatureFlagsStore';

export function useFeatureFlag(key: string, defaultValue = false): boolean {
  return useFeatureFlagsStore((s) => {
    const flag = s.flags[key];
    return flag !== undefined ? flag.isEnabled : defaultValue;
  });
}

export function useFeatureFlagPayload<T = Record<string, unknown>>(
  key: string,
): T | null {
  return useFeatureFlagsStore((s) => s.getPayload<T>(key));
}
