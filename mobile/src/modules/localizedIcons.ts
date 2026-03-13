import { NativeModules, Platform } from 'react-native';
import { getLocales } from 'expo-localization';

const { LocalizedIconsModule } = NativeModules;

/**
 * Returns 'ru' if the device language starts with 'ru', otherwise 'en'.
 */
export function getIconLocale(): 'ru' | 'en' {
  const lang = getLocales()[0]?.languageCode ?? 'en';
  return lang.startsWith('ru') ? 'ru' : 'en';
}

/**
 * Switches the app icon to match the device locale.
 * On Android this is handled automatically by the OS via locale mipmap folders.
 * On iOS we switch programmatically using the alternate icon API.
 */
export async function applyLocalizedIcon(): Promise<void> {
  if (Platform.OS !== 'ios') return;
  if (!LocalizedIconsModule?.setIcon) return;

  const locale = getIconLocale();
  const iconName = locale === 'ru' ? 'AppIconRu' : 'AppIconEn';

  try {
    await LocalizedIconsModule.setIcon(iconName);
  } catch {
    // Silently ignore — icon switching is non-critical
  }
}
