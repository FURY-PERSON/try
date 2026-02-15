import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useThemeContext } from '@/theme';
import type { FC, ReactNode } from 'react';
import type { ViewStyle } from 'react-native';

type ScreenProps = {
  children: ReactNode;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
  style?: ViewStyle;
  padded?: boolean;
};

export const Screen: FC<ScreenProps> = ({
  children,
  edges = ['top', 'left', 'right'],
  style,
  padded = true,
}) => {
  const { colors, spacing, isDark } = useThemeContext();

  return (
    <SafeAreaView
      edges={edges}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <View
        style={[
          styles.content,
          padded && { paddingHorizontal: spacing.screenPadding },
          style,
        ]}
      >
        {children}
      </View>
    </SafeAreaView>
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
