import Config from 'react-native-config';
import { Platform } from 'react-native';
console.log(111, Config)
const DEFAULT_API_URL = Platform.select({
  android: 'http://10.0.2.2:3001/api',
  default: 'http://localhost:3001/api',
});

export const API_URL = Config.API_URL ?? DEFAULT_API_URL;

export const APP_ENV =
  (Config.APP_ENV as 'development' | 'stage' | 'production' | undefined) ??
  'development';

export const APP_VERSION = Config.VERSION_NAME ?? '1.0.0';
export const APP_VERSION_CODE = Config.VERSION_CODE ?? '1';
export const APP_NAME = Config.APP_NAME ?? 'Фронт фактов';
export const IS_DEV = __DEV__;
