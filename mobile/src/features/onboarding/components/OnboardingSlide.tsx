import React from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { useThemeContext } from '@/theme';
import { fontFamily } from '@/theme/typography';
import type { FC } from 'react';
import { s } from '@/utils/scale';

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
    paddingHorizontal: s(32),
  },
  illustrationContainer: {
    width: s(220),
    height: s(220),
    marginBottom: s(32),
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: s(28),
    fontFamily: fontFamily.extraBold,
    lineHeight: s(36),
    textAlign: 'center',
    marginBottom: s(12),
    letterSpacing: -0.3,
  },
  description: {
    fontSize: s(17),
    fontFamily: fontFamily.semiBold,
    lineHeight: s(24),
    textAlign: 'center',
  },
});
