import type { TextStyle } from 'react-native';

export const fontFamily = {
  regular: 'Nunito_400Regular',
  medium: 'Nunito_500Medium',
  semiBold: 'Nunito_600SemiBold',
  bold: 'Nunito_700Bold',
  extraBold: 'Nunito_800ExtraBold',
  black: 'Nunito_900Black',
} as const;

export const typography: Record<string, TextStyle> = {
  displayLarge: { fontSize: 34, lineHeight: 42, fontFamily: fontFamily.extraBold },
  displayMedium: { fontSize: 28, lineHeight: 36, fontFamily: fontFamily.extraBold },

  headlineLarge: { fontSize: 24, lineHeight: 32, fontFamily: fontFamily.bold },
  headlineMedium: { fontSize: 20, lineHeight: 28, fontFamily: fontFamily.bold },

  titleLarge: { fontSize: 18, lineHeight: 24, fontFamily: fontFamily.bold },
  titleMedium: { fontSize: 16, lineHeight: 22, fontFamily: fontFamily.bold },

  bodyLarge: { fontSize: 17, lineHeight: 24, fontFamily: fontFamily.semiBold },
  bodyMedium: { fontSize: 15, lineHeight: 22, fontFamily: fontFamily.regular },
  bodySmall: { fontSize: 13, lineHeight: 18, fontFamily: fontFamily.regular },

  labelLarge: { fontSize: 15, lineHeight: 20, fontFamily: fontFamily.bold },
  labelMedium: { fontSize: 13, lineHeight: 18, fontFamily: fontFamily.semiBold },
  labelSmall: { fontSize: 11, lineHeight: 16, fontFamily: fontFamily.semiBold },

  scoreXL: { fontSize: 48, lineHeight: 56, fontFamily: fontFamily.black },
  scoreLG: { fontSize: 36, lineHeight: 44, fontFamily: fontFamily.extraBold },
} as const;
