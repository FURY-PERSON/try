// Midnight Scholar Design System — Indigo + Amber
export const colors = {
  light: {
    // Brand
    primary: '#6366F1',
    primaryDark: '#4F46E5',
    primaryLight: '#A5B4FC',

    // Accent palette
    blue: '#3B82F6',
    blueDark: '#2563EB',
    orange: '#F59E0B',
    orangeDark: '#D97706',
    red: '#EF4444',
    redDark: '#DC2626',
    purple: '#A855F7',
    purpleDark: '#9333EA',
    gold: '#EAB308',
    goldDark: '#CA8A04',
    emerald: '#10B981',
    emeraldDark: '#059669',

    // Surfaces
    background: '#F8FAFC',
    surface: '#FFFFFF',
    surfaceVariant: '#F1F5F9',
    border: '#E2E8F0',
    borderDark: '#CBD5E1',

    // Text
    textPrimary: '#0F172A',
    textSecondary: '#64748B',
    textTertiary: '#94A3B8',
    textOnPrimary: '#FFFFFF',
    textOnDark: '#FFFFFF',

    // Semantic
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',

    // Special
    adContainer: '#F1F5F9',
    streakFire: '#F59E0B',
    factCard: '#FEF3C7',
    factCardBorder: '#FCD34D',
    overlay: 'rgba(15,23,42,0.5)',

    separator: '#E2E8F0',
    groupedBackground: '#F8FAFC',
    elevatedSurface: '#FFFFFF',
  },
  dark: {
    // Brand
    primary: '#818CF8',
    primaryDark: '#6366F1',
    primaryLight: '#6366F1',

    // Accent palette
    blue: '#60A5FA',
    blueDark: '#3B82F6',
    orange: '#FBBF24',
    orangeDark: '#F59E0B',
    red: '#F87171',
    redDark: '#EF4444',
    purple: '#C084FC',
    purpleDark: '#A855F7',
    gold: '#FACC15',
    goldDark: '#EAB308',
    emerald: '#34D399',
    emeraldDark: '#10B981',

    // Surfaces
    background: '#0F172A',
    surface: '#1E293B',
    surfaceVariant: '#334155',
    border: '#475569',
    borderDark: '#334155',

    // Text
    textPrimary: '#F8FAFC',
    textSecondary: '#94A3B8',
    textTertiary: '#64748B',
    textOnPrimary: '#FFFFFF',
    textOnDark: '#FFFFFF',

    // Semantic
    success: '#34D399',
    warning: '#FBBF24',
    error: '#F87171',
    info: '#60A5FA',

    // Special
    adContainer: '#1E293B',
    streakFire: '#FBBF24',
    factCard: '#1E293B',
    factCardBorder: '#FBBF24',
    overlay: 'rgba(0,0,0,0.7)',

    separator: '#334155',
    groupedBackground: '#0F172A',
    elevatedSurface: '#1E293B',
  },
} as const;

export type ThemeColors = { [K in keyof typeof colors.light]: string };
export type ColorScheme = 'light' | 'dark';
