import React from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { useThemeContext } from '@/theme';
import type { FC } from 'react';

type OnboardingSlideProps = {
  title: string;
  description: string;
  illustration?: React.ReactNode;
};

export const OnboardingSlide: FC<OnboardingSlideProps> = ({
  title,
  description,
  illustration,
}) => {
  const { colors } = useThemeContext();
  const { width } = useWindowDimensions();

  return (
    <View style={[styles.container, { width }]}>
      <View style={styles.illustrationContainer}>{illustration}</View>
      <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
      <Text style={[styles.description, { color: colors.textSecondary }]}>{description}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  illustrationContainer: {
    width: 250,
    height: 250,
    marginBottom: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontFamily: 'Nunito_800ExtraBold',
    lineHeight: 36,
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    fontSize: 17,
    fontFamily: 'Nunito_600SemiBold',
    lineHeight: 24,
    textAlign: 'center',
  },
});
