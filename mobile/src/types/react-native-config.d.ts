declare module 'react-native-config' {
  export interface NativeConfig {
    APP_NAME?: string;
    APP_ENV?: string;
    API_URL?: string;
    VERSION_NAME?: string;
    BUNDLE_ID?: string;
    PRIVACY_POLICY_URL?: string;
  }

  export const Config: NativeConfig;
  export default Config;
}
