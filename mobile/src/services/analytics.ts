import { getFirebaseAnalytics } from './firebase';

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
  | 'card_answered'
  | 'hint_used'
  | 'streak_milestone'
  | 'nickname_set'
  | 'profile_updated'
  | 'settings_changed'
  | 'share_result'
  | 'collection_start'
  | 'collection_complete'
  | 'collection_detail_viewed'
  | 'category_detail_viewed'
  | 'category_start'
  | 'daily_locked_viewed'
  | 'home_section_scroll'
  | 'home_filter_applied';

type AnalyticsParams = Record<string, string | number | boolean>;

export const analytics = {
  logEvent(event: AnalyticsEvent, params?: AnalyticsParams): void {
    if (__DEV__) {
      console.log(`[Analytics] ${event}`, params);
    }
    getFirebaseAnalytics().logEvent(event, params).catch(console.warn);
  },

  setUserProperty(name: string, value: string): void {
    if (__DEV__) {
      console.log(`[Analytics] UserProperty: ${name} = ${value}`);
    }
    getFirebaseAnalytics().setUserProperties({ [name]: value }).catch(console.warn);
  },
};
