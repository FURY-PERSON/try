# Ads Setup Guide

## Unity LevelPlay (ironSource)

### 1. Create LevelPlay Account
- Go to https://app.unity.com/
- Create an account, add your app (iOS + Android)
- Go to LevelPlay → Ad Units → create Banner, Interstitial, Rewarded ad units

### 2. Get App Key & Ad Unit IDs
From the LevelPlay dashboard, copy:

| Value | Where to insert |
|-------|----------------|
| App Key | `mobile/src/constants/ads.ts` → `UNITY_APP_KEY` |
| Banner Ad Unit ID | `mobile/src/constants/ads.ts` → `UNITY_PROD_IDS.banner` |
| Interstitial Ad Unit ID | `mobile/src/constants/ads.ts` → `UNITY_PROD_IDS.interstitial` |
| Rewarded Ad Unit ID | `mobile/src/constants/ads.ts` → `UNITY_PROD_IDS.rewarded` |

### 3. Install SDK
```bash
cd mobile
npm install unity-levelplay-mediation
cd ios && pod install
```

### 4. SKAdNetwork (iOS)
The `su67r6k2v3.skadnetwork` identifier is already configured in `app.json`.
For additional ad networks in mediation, add their SKAdNetwork IDs to `app.json` → `ios.infoPlist.SKAdNetworkItems`.

### 5. app-ads.txt
Add LevelPlay's app-ads.txt entries to your website. Get them from LevelPlay dashboard → Setup → app-ads.txt.

---

## Yandex Mobile Ads

### 1. Create Yandex Ads Account
- Go to https://partner.yandex.ru/
- Register your app and create ad blocks

### 2. Get Block IDs
Create the following ad blocks in Yandex Partner interface:

| Ad Type | Format | Where to insert |
|---------|--------|----------------|
| Banner | Banner 320x50 | `mobile/src/constants/ads.ts` → `YANDEX_PROD_IDS.banner` |
| Interstitial | Fullscreen | `mobile/src/constants/ads.ts` → `YANDEX_PROD_IDS.interstitial` |
| Rewarded | Rewarded video | `mobile/src/constants/ads.ts` → `YANDEX_PROD_IDS.rewarded` |

Block ID format: `R-M-XXXXXXX-N` (e.g., `R-M-1234567-1`)

---

## Feature Flags

All ads are controlled via feature flags from the server. Manage them in the admin panel or via API:

| Flag Key | Description | Payload |
|----------|-------------|---------|
| `ads_enable` | Global ads on/off | - |
| `ad_banner_home` | Banner on Home screen | - |
| `ad_banner_leaderboard` | Banner on Leaderboard screen | - |
| `ad_banner_profile` | Banner on Profile screen | - |
| `ad_banner_category` | Banner on Category/Collection info screen | - |
| `ad_banner_game` | Banner on Game screen | - |
| `ad_banner_results` | Banner on Results screen | - |
| `ad_interstitial_game` | Fullscreen ad before game start | `{ "factsThreshold": 30 }` |
| `ad_rewarded_video` | Rewarded video for ad-free mode | `{ "adFreeMinutes": 30 }` |

### Payload Configuration

**ad_interstitial_game**: Change `factsThreshold` to control how many facts must be answered before showing interstitial. Default: 20.

**ad_rewarded_video**: Change `adFreeMinutes` to control how long ads are disabled after watching video. Default: 30.

---

## Ad Provider Selection Logic

The app automatically selects the ad provider based on user's device region:

- **CIS countries** (RU, BY, KZ, UZ, TJ, KG, AM, AZ, MD, UA, GE, TM) → **Yandex Ads**
- **All other countries** → **Unity LevelPlay**

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
