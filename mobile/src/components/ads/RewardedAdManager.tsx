import { useEffect, useRef, useCallback, useState } from 'react';
import {
  LevelPlayRewardedAd,
  type LevelPlayRewardedAdListener,
} from 'unity-levelplay-mediation';
import {
  RewardedAdLoader,
  AdRequestConfiguration,
} from 'yandex-mobile-ads';
import { adManager } from '@/services/ads';
import { analytics } from '@/services/analytics';
import { getAdProvider } from '@/services/adProvider';

export const useRewardedAd = () => {
  const loadedRef = useRef(false);
  const rewardEarnedRef = useRef(false);
  const resolveRef = useRef<((rewarded: boolean) => void) | null>(null);
  const [isReady, setIsReady] = useState(false);
  const yandexAdRef = useRef<Awaited<ReturnType<typeof RewardedAdLoader.prototype.loadAd>> | null>(null);
  const yandexLoaderRef = useRef<RewardedAdLoader | null>(null);

  const provider = getAdProvider();

  const [rewardedAd] = useState(() => {
    if (provider === 'unity') {
      return new LevelPlayRewardedAd(adManager.getRewardedUnitId());
    }
    return null;
  });

  const loadYandexAd = useCallback(async () => {
    try {
      if (!yandexLoaderRef.current) {
        yandexLoaderRef.current = await RewardedAdLoader.create();
      }
      const config = new AdRequestConfiguration({
        adUnitId: adManager.getRewardedUnitId(),
      });
      const ad = await yandexLoaderRef.current.loadAd(config);
      yandexAdRef.current = ad;
      loadedRef.current = true;
      setIsReady(true);
    } catch {
      loadedRef.current = false;
      setIsReady(false);
    }
  }, []);

  useEffect(() => {
    if (provider === 'yandex') {
      loadYandexAd();
    } else if (provider === 'unity' && rewardedAd) {
      const listener: LevelPlayRewardedAdListener = {
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
          rewardedAd.loadAd();
          resolveRef.current?.(wasRewarded);
          resolveRef.current = null;
        },
        onAdRewarded: () => {
          rewardEarnedRef.current = true;
          analytics.logEvent('ad_rewarded_completed');
          adManager.activateAdFree();
        },
      };

      rewardedAd.setListener(listener);
      rewardedAd.loadAd();
    }
  }, [provider, loadYandexAd, rewardedAd]);

  const showForReward = useCallback((): Promise<boolean> => {
    if (!loadedRef.current) return Promise.resolve(false);

    rewardEarnedRef.current = false;

    return new Promise((resolve) => {
      try {
        if (provider === 'yandex' && yandexAdRef.current) {
          const ad = yandexAdRef.current;
          ad.onRewarded = () => {
            rewardEarnedRef.current = true;
            analytics.logEvent('ad_rewarded_completed');
            adManager.activateAdFree();
          };
          ad.onAdDismissed = () => {
            if (rewardEarnedRef.current) {
              adManager.activateAdFree();
            }
            const wasRewarded = rewardEarnedRef.current;
            rewardEarnedRef.current = false;
            loadedRef.current = false;
            yandexAdRef.current = null;
            setIsReady(false);
            loadYandexAd();
            resolve(wasRewarded);
          };
          ad.onAdFailedToShow = () => {
            loadedRef.current = false;
            setIsReady(false);
            resolve(false);
          };
          ad.show();
          analytics.logEvent('ad_rewarded_shown');
        } else if (rewardedAd) {
          resolveRef.current = resolve;
          rewardedAd.showAd();
          analytics.logEvent('ad_rewarded_shown');
        }
      } catch {
        resolve(false);
      }
    });
  }, [provider, loadYandexAd, rewardedAd]);

  return { showForReward, isReady };
};
