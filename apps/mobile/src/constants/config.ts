import Constants from 'expo-constants';

const extra = Constants.expoConfig?.extra ?? {};

export const API_URL = (extra['API_URL'] as string) ?? 'http://localhost:3001';
export const APP_VERSION = Constants.expoConfig?.version ?? '1.0.0';
export const IS_DEV = __DEV__;
