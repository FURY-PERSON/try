export const colors = {
  light: {
    primary: '#58CC02',
    primaryDark: '#46A302',
    primaryLight: '#89E219',

    blue: '#1CB0F6',
    blueDark: '#1899D6',
    orange: '#FF9600',
    orangeDark: '#E08600',
    red: '#FF4B4B',
    redDark: '#EA2B2B',
    purple: '#CE82FF',
    purpleDark: '#B666E5',
    gold: '#FFC800',
    goldDark: '#E5B400',

    background: '#F7F7F7',
    surface: '#FFFFFF',
    surfaceVariant: '#F0F0F0',
    border: '#E5E5E5',
    borderDark: '#CDCDCD',

    textPrimary: '#4B4B4B',
    textSecondary: '#AFAFAF',
    textOnPrimary: '#FFFFFF',
    textOnDark: '#FFFFFF',

    success: '#58CC02',
    warning: '#FF9600',
    error: '#FF4B4B',
    info: '#1CB0F6',

    adContainer: '#F0F0F0',
    streakFire: '#FF9600',
    factCard: '#FFF9E6',
    factCardBorder: '#FFE066',
    overlay: 'rgba(0,0,0,0.5)',
  },
  dark: {
    primary: '#58CC02',
    primaryDark: '#46A302',
    primaryLight: '#89E219',

    blue: '#1CB0F6',
    blueDark: '#1899D6',
    orange: '#FF9600',
    orangeDark: '#E08600',
    red: '#FF4B4B',
    redDark: '#EA2B2B',
    purple: '#CE82FF',
    purpleDark: '#B666E5',
    gold: '#FFC800',
    goldDark: '#E5B400',

    background: '#131F24',
    surface: '#1B2B32',
    surfaceVariant: '#243640',
    border: '#37464F',
    borderDark: '#2A3940',

    textPrimary: '#FFFFFF',
    textSecondary: '#8A9BA5',
    textOnPrimary: '#FFFFFF',
    textOnDark: '#FFFFFF',

    success: '#58CC02',
    warning: '#FF9600',
    error: '#FF4B4B',
    info: '#1CB0F6',

    adContainer: '#1B2B32',
    streakFire: '#FF9600',
    factCard: '#2A3940',
    factCardBorder: '#FFE066',
    overlay: 'rgba(0,0,0,0.7)',
  },
} as const;

export type ThemeColors = typeof colors.light;
export type ColorScheme = 'light' | 'dark';
