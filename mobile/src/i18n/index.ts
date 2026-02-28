import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';
import ru from './locales/ru.json';
import en from './locales/en.json';

const CIS_LOCALES = ['ru', 'be', 'uk', 'kk'];
const deviceLocale = getLocales()[0]?.languageCode ?? 'en';
const initialLanguage = CIS_LOCALES.includes(deviceLocale) ? 'ru' : 'en';

i18n.use(initReactI18next).init({
  resources: {
    ru: { translation: ru },
    en: { translation: en },
  },
  lng: initialLanguage,
  fallbackLng: 'ru',
  interpolation: {
    escapeValue: false,
  },
  compatibilityJSON: 'v4',
});

export default i18n;
