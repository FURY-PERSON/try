import React from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeContext } from '@/theme';
import type { ViewStyle } from 'react-native';
import type { FC, ReactNode } from 'react';
import type { ThemeGradients } from '@/theme';

type GradientVariant = keyof ThemeGradients;

type GradientBackgroundProps = {
  variant: GradientVariant;
  style?: ViewStyle;
  children?: ReactNode;
  start?: { x: number; y: number };
  end?: { x: number; y: number };
};

export const GradientBackground: FC<GradientBackgroundProps> = ({
  variant,
  style,
  children,
  start = { x: 0, y: 0 },
  end = { x: 1, y: 1 },
}) => {
  const { gradients } = useThemeContext();
  const gradientColors = gradients[variant];

  return (
    <LinearGradient colors={gradientColors} start={start} end={end} style={style}>
      {children}
    </LinearGradient>
  );
};
