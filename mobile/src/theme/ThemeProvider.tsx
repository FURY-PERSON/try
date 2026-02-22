import React, { createContext, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { colors } from './colors';
import { typography } from './typography';
import { spacing, borderRadius, duoShadow, elevation } from './spacing';
import { useSettingsStore } from '@/stores/useSettingsStore';
import type { ThemeColors, ColorScheme } from './colors';
import type { FC, ReactNode } from 'react';

type Theme = {
  colors: ThemeColors;
  typography: typeof typography;
  spacing: typeof spacing;
  borderRadius: typeof borderRadius;
  duoShadow: typeof duoShadow;
  elevation: typeof elevation;
  colorScheme: ColorScheme;
  isDark: boolean;
};

const ThemeContext = createContext<Theme | null>(null);

type ThemeProviderProps = {
  children: ReactNode;
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
      duoShadow,
      elevation,
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
