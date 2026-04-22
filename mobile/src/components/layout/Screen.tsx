import React from 'react';
import { View, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useThemeContext } from '@/theme';
import type { FC, ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

type ScreenProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  padded?: boolean;
  backgroundColor?: string;
  paddingHorizontal?: boolean
};

export const Screen: FC<ScreenProps> = ({
  children,
  style,
  padded = true,
  backgroundColor: bgOverride,
  paddingHorizontal = true
}) => {
  const { colors, spacing, isDark } = useThemeContext();

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: bgOverride ?? colors.background },
      ]}
    >
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <View
        style={[
          styles.content,
          padded && { paddingHorizontal: paddingHorizontal ? spacing.screenPadding : undefined },
          style,
        ]}
      >
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
});
