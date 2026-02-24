import React, { createContext, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { colors } from './colors';
import { typography } from './typography';
import { spacing, borderRadius, elevation } from './spacing';
import { useSettingsStore } from '@/stores/useSettingsStore';
import type { ThemeColors, ColorScheme } from './colors';
import type { FC, ReactNode } from 'react';

export type ThemeGradients = {
  primary: [string, string];
  success: [string, string];
  danger: [string, string];
  warm: [string, string];
  hero: [string, string];
  card: [string, string];
};

type Theme = {
  colors: ThemeColors;
  typography: typeof typography;
  spacing: typeof spacing;
  borderRadius: typeof borderRadius;
  elevation: typeof elevation;
  gradients: ThemeGradients;
  colorScheme: ColorScheme;
  isDark: boolean;
};

const ThemeContext = createContext<Theme | null>(null);

type ThemeProviderProps = {
  children: ReactNode;
};

const lightGradients: ThemeGradients = {
  primary: ['#6366F1', '#8B5CF6'],
  success: ['#10B981', '#34D399'],
  danger: ['#EF4444', '#F87171'],
  warm: ['#F59E0B', '#FBBF24'],
  hero: ['#EEF2FF', '#F8FAFC'],
  card: ['rgba(99,102,241,0.06)', 'rgba(99,102,241,0.01)'],
};

const darkGradients: ThemeGradients = {
  primary: ['#6366F1', '#7C3AED'],
  success: ['#059669', '#10B981'],
  danger: ['#DC2626', '#EF4444'],
  warm: ['#D97706', '#F59E0B'],
  hero: ['#1E293B', '#0F172A'],
  card: ['rgba(99,102,241,0.12)', 'rgba(99,102,241,0.03)'],
};

export const ThemeProvider: FC<ThemeProviderProps> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const themePreference = useSettingsStore((s) => s.theme);

  const colorScheme: ColorScheme = useMemo(() => {
    if (themePreference === 'system') {
      return systemColorScheme === 'dark' ? 'dark' : 'light';
    }
    return themePreference;
  }, [themePreference, systemColorScheme]);

  const theme: Theme = useMemo(
    () => ({
      colors: colors[colorScheme],
      typography,
      spacing,
      borderRadius,
      elevation,
      gradients: colorScheme === 'dark' ? darkGradients : lightGradients,
      colorScheme,
      isDark: colorScheme === 'dark',
    }),
    [colorScheme],
  );

  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
};

export const useThemeContext = (): Theme => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeContext must be used within a ThemeProvider');
  }
  return context;
};
