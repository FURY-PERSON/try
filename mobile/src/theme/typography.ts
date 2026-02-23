import type { TextStyle } from 'react-native';

export const fontFamily = {
  regular: 'Nunito_400Regular',
  medium: 'Nunito_500Medium',
  semiBold: 'Nunito_600SemiBold',
  bold: 'Nunito_700Bold',
  extraBold: 'Nunito_800ExtraBold',
  black: 'Nunito_900Black',
} as const;

// Apple HIG-inspired type scale using Nunito
export const typography: Record<string, TextStyle> = {
  // Large Title — used for top-level screen titles
  largeTitle: { fontSize: 34, lineHeight: 41, fontFamily: fontFamily.bold, letterSpacing: 0.37 },

  // Display — used for hero numbers and big callouts
  displayLarge: { fontSize: 34, lineHeight: 42, fontFamily: fontFamily.bold },
  displayMedium: { fontSize: 28, lineHeight: 36, fontFamily: fontFamily.bold },

  // Headlines
  headlineLarge: { fontSize: 22, lineHeight: 28, fontFamily: fontFamily.bold },
  headlineMedium: { fontSize: 20, lineHeight: 25, fontFamily: fontFamily.semiBold },

  // Titles
  titleLarge: { fontSize: 17, lineHeight: 22, fontFamily: fontFamily.semiBold },
  titleMedium: { fontSize: 16, lineHeight: 21, fontFamily: fontFamily.semiBold },

  // Body
  bodyLarge: { fontSize: 17, lineHeight: 22, fontFamily: fontFamily.regular },
  bodyMedium: { fontSize: 15, lineHeight: 20, fontFamily: fontFamily.regular },
  bodySmall: { fontSize: 13, lineHeight: 18, fontFamily: fontFamily.regular },

  // Labels & Captions
  labelLarge: { fontSize: 15, lineHeight: 20, fontFamily: fontFamily.semiBold },
  labelMedium: { fontSize: 13, lineHeight: 18, fontFamily: fontFamily.medium },
  labelSmall: { fontSize: 11, lineHeight: 13, fontFamily: fontFamily.medium },

  // Scores — used for game results
  scoreXL: { fontSize: 48, lineHeight: 56, fontFamily: fontFamily.bold },
  scoreLG: { fontSize: 36, lineHeight: 44, fontFamily: fontFamily.bold },

  // Caption
  caption1: { fontSize: 12, lineHeight: 16, fontFamily: fontFamily.regular },
  caption2: { fontSize: 11, lineHeight: 13, fontFamily: fontFamily.regular },
} as const;
