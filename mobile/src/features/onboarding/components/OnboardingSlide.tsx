import React from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { useThemeContext } from '@/theme';
import { fontFamily } from '@/theme/typography';
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
    width: 220,
    height: 220,
    marginBottom: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontFamily: fontFamily.extraBold,
    lineHeight: 36,
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  description: {
    fontSize: 17,
    fontFamily: fontFamily.semiBold,
    lineHeight: 24,
    textAlign: 'center',
  },
});
