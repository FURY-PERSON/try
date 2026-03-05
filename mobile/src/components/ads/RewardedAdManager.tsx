import { useEffect, useRef, useCallback, useState } from 'react';
import {
  RewardedAd,
  RewardedAdEventType,
  AdEventType,
} from 'react-native-google-mobile-ads';
import {
  RewardedAdLoader,
  AdRequestConfiguration,
} from 'yandex-mobile-ads';
import { adManager } from '@/services/ads';
import { analytics } from '@/services/analytics';
import { getAdProvider } from '@/services/adProvider';

const googleRewarded = RewardedAd.createForAdRequest(adManager.getRewardedUnitId());

export const useRewardedAd = () => {
  const loadedRef = useRef(false);
  const rewardEarnedRef = useRef(false);
  const resolveRef = useRef<((rewarded: boolean) => void) | null>(null);
  const [isReady, setIsReady] = useState(false);
  const yandexAdRef = useRef<Awaited<ReturnType<typeof RewardedAdLoader.prototype.loadAd>> | null>(null);
  const yandexLoaderRef = useRef<RewardedAdLoader | null>(null);

  const provider = getAdProvider();

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
    } else {
      const unsubscribeLoaded = googleRewarded.addAdEventListener(
        RewardedAdEventType.LOADED,
        () => {
          loadedRef.current = true;
          setIsReady(true);
        },
      );

      const unsubscribeEarned = googleRewarded.addAdEventListener(
        RewardedAdEventType.EARNED_REWARD,
        () => {
          rewardEarnedRef.current = true;
          analytics.logEvent('ad_rewarded_completed');
          adManager.activateAdFree();
        },
      );

      const unsubscribeClosed = googleRewarded.addAdEventListener(
        AdEventType.CLOSED,
        () => {
          if (rewardEarnedRef.current) {
            adManager.activateAdFree();
          }
          const wasRewarded = rewardEarnedRef.current;
          rewardEarnedRef.current = false;
          loadedRef.current = false;
          setIsReady(false);
          googleRewarded.load();
          resolveRef.current?.(wasRewarded);
          resolveRef.current = null;
        },
      );

      googleRewarded.load();

      return () => {
        unsubscribeLoaded();
        unsubscribeEarned();
        unsubscribeClosed();
      };
    }
  }, [provider, loadYandexAd]);

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
        } else {
          resolveRef.current = resolve;
          googleRewarded.show().catch(() => {
            resolveRef.current = null;
            resolve(false);
          });
          analytics.logEvent('ad_rewarded_shown');
        }
      } catch {
        resolve(false);
      }
    });
  }, [provider, loadYandexAd]);

  return { showForReward, isReady };
};
