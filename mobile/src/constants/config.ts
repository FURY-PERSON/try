import Constants from 'expo-constants';
import { Platform } from 'react-native';

const DEFAULT_API_URL = Platform.select({
  android: 'http://10.0.2.2:3001',
  default: 'http://localhost:3001',
});

export const API_URL =
  process.env.EXPO_PUBLIC_API_URL ??
  (Constants.expoConfig?.extra?.['API_URL'] as string | undefined) ??
  DEFAULT_API_URL;

export const APP_ENV =
  (process.env.EXPO_PUBLIC_ENV as 'development' | 'stage' | 'production' | undefined) ??
  'development';

export const APP_VERSION = Constants.expoConfig?.version ?? '1.0.0';
export const IS_DEV = __DEV__;
