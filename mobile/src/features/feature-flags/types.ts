export type FeatureFlag = {
  key: string;
  isEnabled: boolean;
  payload: Record<string, unknown> | null;
};

export type FeatureFlagsMap = Record<string, FeatureFlag>;
