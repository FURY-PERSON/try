import { useEffect, useRef, useCallback, useState } from 'react';
import { adManager } from '@/services/ads';
import { analytics } from '@/services/analytics';
import { useAdsStore } from '@/stores/useAdsStore';
import { getAdProvider } from '@/services/adProvider';
import { apiClient } from '@/services/api';

export const useRewardedAd = () => {
  const loadedRef = useRef(false);
  const rewardEarnedRef = useRef(false);
  const adNetworkRef = useRef('unknown');
  const resolveRef = useRef<((rewarded: boolean) => void) | null>(null);
  const [isReady, setIsReady] = useState(false);
  const unityAdRef = useRef<any>(null);

  const provider = getAdProvider();
  const sdkReady = useAdsStore((s) => s.sdkReady);

  useEffect(() => {
    if (provider !== 'unity' || !sdkReady) return;

    import('unity-levelplay-mediation').then(({ LevelPlayRewardedAd }) => {
      try {
        const ad = new LevelPlayRewardedAd(adManager.getRewardedUnitId());
        unityAdRef.current = ad;

        ad.setListener({
          onAdLoaded: (adInfo) => {
            loadedRef.current = true;
            adNetworkRef.current = adInfo?.adNetwork ?? 'unknown';
            setIsReady(true);
          },
          onAdLoadFailed: (error) => {
            loadedRef.current = false;
            setIsReady(false);
            analytics.logEvent('ad_rewarded_failed', { provider: provider ?? 'unknown' });
            const errorCode = error?.errorCode ?? 0;
            
            apiClient.post('/logs', {
              type: 'ad_rewarded_failed',
              message: JSON.stringify(error),
              meta: { provider, errorCode },
              deviceId: undefined,
            }).catch(() => {});
          },
          onAdInfoChanged: () => {},
          onAdDisplayed: () => {},
          onAdDisplayFailed: () => {
            loadedRef.current = false;
            setIsReady(false);
            resolveRef.current?.(false);
            resolveRef.current = null;
          },
          onAdClicked: () => {},
          onAdClosed: () => {
            const wasRewarded = rewardEarnedRef.current;
            rewardEarnedRef.current = false;
            loadedRef.current = false;
            setIsReady(false);
            ad.loadAd();
            resolveRef.current?.(wasRewarded);
            resolveRef.current = null;
          },
          onAdRewarded: () => {
            rewardEarnedRef.current = true;
            analytics.logEvent('ad_rewarded_completed', { provider: provider ?? 'unknown', adNetwork: adNetworkRef.current });
          },
        });

        ad.loadAd();
      } catch {
        // Unity ad creation failed
      }
    }).catch(() => {});
  }, [provider, sdkReady]);

  const showForReward = useCallback((): Promise<boolean> => {
    if (!loadedRef.current) return Promise.resolve(false);

    rewardEarnedRef.current = false;

    return new Promise((resolve) => {
      try {
        if (unityAdRef.current) {
          resolveRef.current = resolve;
          unityAdRef.current.showAd();
          analytics.logEvent('ad_rewarded_shown', { provider: provider ?? 'unknown', adNetwork: adNetworkRef.current });
        } else {
          resolve(false);
        }
      } catch {
        resolve(false);
      }
    });
  }, []);

  const getAdNetwork = useCallback(() => adNetworkRef.current, []);

  return { showForReward, isReady, getAdNetwork };
};
