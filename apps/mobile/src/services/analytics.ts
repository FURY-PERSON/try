type AnalyticsEvent =
  | 'app_open'
  | 'onboarding_start'
  | 'onboarding_complete'
  | 'game_start'
  | 'game_complete'
  | 'daily_set_start'
  | 'daily_set_complete'
  | 'fact_viewed'
  | 'fact_shared'
  | 'ad_banner_shown'
  | 'ad_interstitial_shown'
  | 'ad_rewarded_shown'
  | 'ad_rewarded_completed'
  | 'hint_used'
  | 'streak_milestone'
  | 'nickname_set'
  | 'settings_changed'
  | 'share_result';

type AnalyticsParams = Record<string, string | number | boolean>;

export const analytics = {
  logEvent(event: AnalyticsEvent, params?: AnalyticsParams): void {
    if (__DEV__) {
      console.log(`[Analytics] ${event}`, params);
      return;
    }
    // TODO: Integrate Firebase Analytics
    // firebase.analytics().logEvent(event, params);
  },

  setUserProperty(name: string, value: string): void {
    if (__DEV__) {
      console.log(`[Analytics] UserProperty: ${name} = ${value}`);
      return;
    }
    // TODO: Integrate Firebase Analytics
    // firebase.analytics().setUserProperty(name, value);
  },
};
