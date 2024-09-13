export interface FeatureConfig {
  timeTracking: boolean;
  onboarding: boolean;
  chat: boolean;
  dashboard: boolean;
}

export const defaultFeatureConfig: FeatureConfig = {
  timeTracking: true,
  onboarding: true,
  chat: true,
  dashboard: true,
};
