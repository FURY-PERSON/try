import { useState, useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';
import type { NetworkStatus } from '@/types/common';

export const useNetworkStatus = (): NetworkStatus => {
  const [status, setStatus] = useState<NetworkStatus>('unknown');

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setStatus(state.isConnected ? 'online' : 'offline');
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return status;
};
