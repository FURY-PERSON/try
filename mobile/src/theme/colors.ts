// Apple Human Interface Guidelines — System Colors
export const colors = {
  light: {
    primary: '#34C759',
    primaryDark: '#248A3D',
    primaryLight: '#A8F0BA',

    blue: '#007AFF',
    blueDark: '#0056B3',
    orange: '#FF9500',
    orangeDark: '#C93400',
    red: '#FF3B30',
    redDark: '#D70015',
    purple: '#AF52DE',
    purpleDark: '#8944AB',
    gold: '#FFCC00',
    goldDark: '#A05A2C',

    background: '#F2F2F7',
    surface: '#FFFFFF',
    surfaceVariant: '#F2F2F7',
    border: 'rgba(60,60,67,0.12)',
    borderDark: 'rgba(60,60,67,0.18)',

    textPrimary: '#000000',
    textSecondary: 'rgba(60,60,67,0.6)',
    textTertiary: 'rgba(60,60,67,0.3)',
    textOnPrimary: '#FFFFFF',
    textOnDark: '#FFFFFF',

    success: '#34C759',
    warning: '#FF9500',
    error: '#FF3B30',
    info: '#007AFF',

    adContainer: '#F2F2F7',
    streakFire: '#FF9500',
    factCard: '#FFF8E1',
    factCardBorder: '#FFD54F',
    overlay: 'rgba(0,0,0,0.4)',

    separator: 'rgba(60,60,67,0.12)',
    groupedBackground: '#F2F2F7',
    elevatedSurface: '#FFFFFF',
  },
  dark: {
    primary: '#30D158',
    primaryDark: '#248A3D',
    primaryLight: '#30D158',

    blue: '#0A84FF',
    blueDark: '#0056B3',
    orange: '#FF9F0A',
    orangeDark: '#C93400',
    red: '#FF453A',
    redDark: '#D70015',
    purple: '#BF5AF2',
    purpleDark: '#8944AB',
    gold: '#FFD60A',
    goldDark: '#A05A2C',

    background: '#000000',
    surface: '#1C1C1E',
    surfaceVariant: '#2C2C2E',
    border: 'rgba(84,84,88,0.36)',
    borderDark: 'rgba(84,84,88,0.5)',

    textPrimary: '#FFFFFF',
    textSecondary: 'rgba(235,235,245,0.6)',
    textTertiary: 'rgba(235,235,245,0.3)',
    textOnPrimary: '#FFFFFF',
    textOnDark: '#FFFFFF',

    success: '#30D158',
    warning: '#FF9F0A',
    error: '#FF453A',
    info: '#0A84FF',

    adContainer: '#1C1C1E',
    streakFire: '#FF9F0A',
    factCard: '#2C2C2E',
    factCardBorder: '#FFD54F',
    overlay: 'rgba(0,0,0,0.6)',

    separator: 'rgba(84,84,88,0.36)',
    groupedBackground: '#000000',
    elevatedSurface: '#1C1C1E',
  },
} as const;

export type ThemeColors = { [K in keyof typeof colors.light]: string };
export type ColorScheme = 'light' | 'dark';
