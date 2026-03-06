import { useEffect, useRef, useCallback, useState } from 'react';
import { adManager } from '@/services/ads';
import { analytics } from '@/services/analytics';
import { useAdsStore } from '@/stores/useAdsStore';
import { getAdProvider } from '@/services/adProvider';

export const useRewardedAd = () => {
  const loadedRef = useRef(false);
  const rewardEarnedRef = useRef(false);
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
          onAdLoaded: () => {
            loadedRef.current = true;
            setIsReady(true);
          },
          onAdLoadFailed: () => {
            loadedRef.current = false;
            setIsReady(false);
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
            if (wasRewarded) {
              adManager.activateAdFree();
            }
            rewardEarnedRef.current = false;
            loadedRef.current = false;
            setIsReady(false);
            ad.loadAd();
            resolveRef.current?.(wasRewarded);
            resolveRef.current = null;
          },
          onAdRewarded: () => {
            rewardEarnedRef.current = true;
            analytics.logEvent('ad_rewarded_completed');
            adManager.activateAdFree();
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
          analytics.logEvent('ad_rewarded_shown');
        } else {
          resolve(false);
        }
      } catch {
        resolve(false);
      }
    });
  }, []);

  return { showForReward, isReady };
};
