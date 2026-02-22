export const LANGUAGES = {
  RU: 'ru',
  EN: 'en',
} as const;

export type Language = (typeof LANGUAGES)[keyof typeof LANGUAGES];

export const LANGUAGE_VALUES = Object.values(LANGUAGES);

export const USER_LANGUAGE_PREFERENCE = {
  RU: 'ru',
  EN: 'en',
  BOTH: 'both',
} as const;

export type UserLanguagePreference =
  (typeof USER_LANGUAGE_PREFERENCE)[keyof typeof USER_LANGUAGE_PREFERENCE];
