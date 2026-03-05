# Ads Setup Guide

## Google AdMob

### 1. Create AdMob Account
- Go to https://admob.google.com/
- Create an account and register your app (iOS + Android)

### 2. Get Ad Unit IDs
Create the following ad units in AdMob console:

| Ad Type | Platform | Where to insert |
|---------|----------|----------------|
| Banner | iOS | `mobile/src/constants/ads.ts` -> `GOOGLE_PROD_IDS.banner.ios` |
| Banner | Android | `mobile/src/constants/ads.ts` -> `GOOGLE_PROD_IDS.banner.android` |
| Interstitial | iOS | `mobile/src/constants/ads.ts` -> `GOOGLE_PROD_IDS.interstitial.ios` |
| Interstitial | Android | `mobile/src/constants/ads.ts` -> `GOOGLE_PROD_IDS.interstitial.android` |
| Rewarded | iOS | `mobile/src/constants/ads.ts` -> `GOOGLE_PROD_IDS.rewarded.ios` |
| Rewarded | Android | `mobile/src/constants/ads.ts` -> `GOOGLE_PROD_IDS.rewarded.android` |

### 3. Configure App ID
Add your AdMob App ID to:
- **iOS**: `mobile/ios/Frontfaktov/Info.plist` -> `GADApplicationIdentifier`
- **Android**: `mobile/android/app/src/main/AndroidManifest.xml` -> `com.google.android.gms.ads.APPLICATION_ID`

The `react-native-google-mobile-ads` package is already installed.

---

## Yandex Mobile Ads

### 1. Create Yandex Ads Account
- Go to https://partner.yandex.ru/
- Register your app and create ad blocks

### 2. Install SDK
```bash
cd mobile
npm install react-native-yandex-mobile-ads
cd ios && pod install
```

### 3. Get Block IDs
Create the following ad blocks in Yandex Partner interface:

| Ad Type | Format | Where to insert |
|---------|--------|----------------|
| Banner | Banner 320x50 | `mobile/src/constants/ads.ts` -> `YANDEX_PROD_IDS.banner` |
| Interstitial | Fullscreen | `mobile/src/constants/ads.ts` -> `YANDEX_PROD_IDS.interstitial` |
| Rewarded | Rewarded video | `mobile/src/constants/ads.ts` -> `YANDEX_PROD_IDS.rewarded` |

Block ID format: `R-M-XXXXXXX-N` (e.g., `R-M-1234567-1`)

### 4. Configure Native SDK

**iOS** (`mobile/ios/Podfile`):
The pod `YandexMobileAds` will be added automatically via `react-native-yandex-mobile-ads`.

**Android** (`mobile/android/build.gradle`):
The Yandex Ads Maven repository will be added automatically.

### 5. Update AdBanner Component
Once `react-native-yandex-mobile-ads` is installed, uncomment the Yandex banner code in:
`mobile/src/components/ads/AdBanner.tsx`

---

## Feature Flags

All ads are controlled via feature flags from the server. Manage them in the admin panel or via API:

| Flag Key | Description | Payload |
|----------|-------------|---------|
| `ads_enable` | Global ads on/off | - |
| `yandex_ads` | Enable Yandex provider | - |
| `google_ads` | Enable Google provider | - |
| `ad_banner_home` | Banner on Home screen | - |
| `ad_banner_leaderboard` | Banner on Leaderboard screen | - |
| `ad_banner_profile` | Banner on Profile screen | - |
| `ad_banner_category` | Banner on Category/Collection info screen | - |
| `ad_banner_game` | Banner on Game screen | - |
| `ad_banner_results` | Banner on Results screen | - |
| `ad_interstitial_game` | Fullscreen ad before game start | `{ "factsThreshold": 30 }` |
| `ad_rewarded_video` | Rewarded video for ad-free mode | `{ "adFreeMinutes": 30 }` |

### Payload Configuration

**ad_interstitial_game**: Change `factsThreshold` to control how many facts must be answered before showing interstitial. Default: 30.

**ad_rewarded_video**: Change `adFreeMinutes` to control how long ads are disabled after watching video. Default: 30.

---

## Ad Provider Selection Logic

The app automatically selects the ad provider based on user's device region:

- **CIS countries** (RU, BY, KZ, UZ, TJ, KG, AM, AZ, MD, UA, GE, TM) -> **Yandex Ads**
- **All other countries** -> **Google Ads**

If one provider's feature flag is disabled, the other will be used as fallback.

---

## Interstitial Logic

- Shows before game start (not during)
- Only after user has answered >= N facts total (N from `ad_interstitial_game` payload, default 30)
- **First game of the day is always ad-free** (improves user loyalty)
- Cooldown: 120 seconds between interstitials
- Max 10 interstitials per day

## Rewarded Video Logic

- Icon appears next to streak badge on Home screen
- After watching: all ads disabled for N minutes (from `ad_rewarded_video` payload)
- Timer icon replaces the video icon during ad-free period
- Modal appears automatically after returning from interstitial
