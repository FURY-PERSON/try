import firebase from '@react-native-firebase/app';
import analytics from '@react-native-firebase/analytics';
import crashlytics from '@react-native-firebase/crashlytics';
import { APP_ENV } from '@/constants/config';


export { firebase, analytics, crashlytics };

export function getFirebaseAnalytics() {
  return analytics();
}

export function getFirebaseCrashlytics() {
  return crashlytics();
}

export async function initializeFirebase(): Promise<void> {
  if (!firebase.apps.length) {
    console.warn('[Firebase] No default app found — check GoogleService-Info.plist / google-services.json');
    return;
  }

  console.log(`[Firebase] Initialized: ${firebase.app().name}`);

  const crashlyticsInstance = crashlytics();
  //await crashlyticsInstance.setCrashlyticsCollectionEnabled(!__DEV__);
  await crashlyticsInstance.setCrashlyticsCollectionEnabled(true);

  const isProduction = APP_ENV === 'production';

  const analyticsInstance = analytics();
  await analyticsInstance.setAnalyticsCollectionEnabled(isProduction);
  if (isProduction) {
    await analyticsInstance.setConsent({
      analytics_storage: true,
      ad_storage: true,
      ad_user_data: true,
      ad_personalization: true,
    });
  }

  if (!isProduction) {
    console.log(`[Firebase] Analytics disabled (env: ${APP_ENV})`);
  }
}
