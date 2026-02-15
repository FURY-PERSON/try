import { useEffect, useRef, useCallback, useState } from 'react';
import {
  RewardedAd,
  RewardedAdEventType,
} from 'react-native-google-mobile-ads';
import { adManager } from '@/services/ads';
import { analytics } from '@/services/analytics';

const rewarded = RewardedAd.createForAdRequest(adManager.getRewardedUnitId());

export const useRewardedAd = () => {
  const loadedRef = useRef(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const unsubscribeLoaded = rewarded.addAdEventListener(
      RewardedAdEventType.LOADED,
      () => {
        loadedRef.current = true;
        setIsReady(true);
      },
    );

    const unsubscribeEarned = rewarded.addAdEventListener(
      RewardedAdEventType.EARNED_REWARD,
      () => {
        analytics.logEvent('ad_rewarded_completed');
      },
    );

    rewarded.load();

    return () => {
      unsubscribeLoaded();
      unsubscribeEarned();
    };
  }, []);

  const showForReward = useCallback(async (): Promise<boolean> => {
    if (!loadedRef.current) return false;

    try {
      await rewarded.show();
      analytics.logEvent('ad_rewarded_shown');
      loadedRef.current = false;
      setIsReady(false);
      rewarded.load();
      return true;
    } catch {
      return false;
    }
  }, []);

  return { showForReward, isReady };
};
