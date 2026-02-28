import Constants from 'expo-constants';
import { Platform } from 'react-native';

const extra = Constants.expoConfig?.extra ?? {};

const DEFAULT_API_URL = Platform.select({
  android: 'http://10.0.2.2:3001',
  default: 'http://localhost:3001',
});

export const API_URL = (extra['API_URL'] as string) ?? DEFAULT_API_URL;
export const APP_VERSION = Constants.expoConfig?.version ?? '1.0.0';
export const IS_DEV = __DEV__;
