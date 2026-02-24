import type { TextStyle } from 'react-native';

export const fontFamily = {
  regular: 'Nunito_400Regular',
  medium: 'Nunito_500Medium',
  semiBold: 'Nunito_600SemiBold',
  bold: 'Nunito_700Bold',
  extraBold: 'Nunito_800ExtraBold',
  black: 'Nunito_900Black',
} as const;

// Midnight Scholar type scale — Nunito
export const typography: Record<string, TextStyle> = {
  // Hero — dramatic score numbers, streak milestones
  hero: { fontSize: 56, lineHeight: 64, fontFamily: fontFamily.black, letterSpacing: -1.5 },

  // Large Title — top-level screen titles
  largeTitle: { fontSize: 32, lineHeight: 38, fontFamily: fontFamily.bold, letterSpacing: -0.5 },

  // Display — big callouts, hero cards
  displayLarge: { fontSize: 28, lineHeight: 34, fontFamily: fontFamily.bold, letterSpacing: -0.3 },
  displayMedium: { fontSize: 24, lineHeight: 30, fontFamily: fontFamily.bold, letterSpacing: -0.2 },

  // Headlines
  headlineLarge: { fontSize: 20, lineHeight: 26, fontFamily: fontFamily.bold },
  headlineMedium: { fontSize: 18, lineHeight: 24, fontFamily: fontFamily.semiBold },

  // Titles
  titleLarge: { fontSize: 17, lineHeight: 22, fontFamily: fontFamily.semiBold },
  titleMedium: { fontSize: 15, lineHeight: 20, fontFamily: fontFamily.semiBold },

  // Body
  bodyLarge: { fontSize: 16, lineHeight: 24, fontFamily: fontFamily.regular },
  bodyMedium: { fontSize: 14, lineHeight: 20, fontFamily: fontFamily.regular },
  bodySmall: { fontSize: 13, lineHeight: 18, fontFamily: fontFamily.regular },

  // Labels
  labelLarge: { fontSize: 14, lineHeight: 18, fontFamily: fontFamily.semiBold, letterSpacing: 0.2 },
  labelMedium: { fontSize: 12, lineHeight: 16, fontFamily: fontFamily.medium, letterSpacing: 0.3 },
  labelSmall: { fontSize: 11, lineHeight: 14, fontFamily: fontFamily.medium, letterSpacing: 0.5 },

  // Scores — game results
  scoreXL: { fontSize: 48, lineHeight: 56, fontFamily: fontFamily.black, letterSpacing: -1 },
  scoreLG: { fontSize: 36, lineHeight: 44, fontFamily: fontFamily.bold, letterSpacing: -0.5 },

  // Captions
  caption1: { fontSize: 12, lineHeight: 16, fontFamily: fontFamily.regular },
  caption2: { fontSize: 11, lineHeight: 14, fontFamily: fontFamily.regular },

  // Overline — section labels, category tags
  overline: {
    fontSize: 11,
    lineHeight: 14,
    fontFamily: fontFamily.bold,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
} as const;
