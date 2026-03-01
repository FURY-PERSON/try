import { API_URL } from '@/constants/config';
import type { FeatureFlag } from './types';

export async function fetchFeatureFlags(): Promise<FeatureFlag[]> {
  const response = await fetch(`${API_URL}/api/feature-flags`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    signal: AbortSignal.timeout(10_000),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch feature flags: ${response.status}`);
  }

  const json: unknown = await response.json();

  if (Array.isArray(json)) {
    return json as FeatureFlag[];
  }

  const withData = json as { data?: FeatureFlag[] };
  return withData.data ?? [];
}
