declare module 'react-native-config' {
  export interface NativeConfig {
    APP_NAME?: string;
    APP_ENV?: string;
    API_URL?: string;
    VERSION_NAME?: string;
    VERSION_CODE?: string;
    BUNDLE_ID?: string;
  }

  export const Config: NativeConfig;
  export default Config;
}
