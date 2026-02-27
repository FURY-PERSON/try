import firebase from '@react-native-firebase/app';
import analytics from '@react-native-firebase/analytics';
import crashlytics from '@react-native-firebase/crashlytics';


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

  const analyticsInstance = analytics();
  await analyticsInstance.setAnalyticsCollectionEnabled(true);
  await analyticsInstance.setConsent({
    analytics_storage: true,
    ad_storage: true,
    ad_user_data: true,
    ad_personalization: true,
  });

  if (__DEV__) {
    console.log('[Firebase] Analytics & Crashlytics enabled (dev mode)');
  }
}
