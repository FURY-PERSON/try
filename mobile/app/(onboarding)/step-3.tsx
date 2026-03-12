import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Screen } from '@/components/layout/Screen';
import { Button } from '@/components/ui/Button';
import { AnimatedEntrance } from '@/components/ui/AnimatedEntrance';
import { useOnboarding } from '@/features/onboarding/hooks/useOnboarding';
import { useThemeContext } from '@/theme';
import { fontFamily } from '@/theme/typography';
import { s } from '@/utils/scale';

export default function OnboardingStep3() {
  const insets = useSafeAreaInsets();
  const { colors, gradients } = useThemeContext();
  const { t } = useTranslation();
  const { selectLanguage } = useOnboarding();

  return (
    <Screen padded={false} backgroundColor={gradients.hero[0]}>
      <LinearGradient
        colors={gradients.hero}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={[styles.container, { paddingTop: insets.top }]}
      >
        <View style={styles.content}>
          <AnimatedEntrance delay={0} direction="up">
            <View style={styles.illustrationWrapper}>
              <LinearGradient
                colors={[colors.gold + '25', colors.gold + '08']}
                style={styles.illustration}
              >
                <MaterialCommunityIcons name="translate" size={80} color={colors.gold} />
              </LinearGradient>
            </View>
          </AnimatedEntrance>

          <AnimatedEntrance delay={150} direction="up">
            <Text style={[styles.title, { color: colors.textPrimary }]}>
              {t('onboarding.step3Title')}
            </Text>
          </AnimatedEntrance>

          <AnimatedEntrance delay={300} direction="up">
            <Text style={[styles.description, { color: colors.textSecondary }]}>
              {t('onboarding.step3Desc')}
            </Text>
          </AnimatedEntrance>
        </View>

        <AnimatedEntrance delay={450} direction="up">
          <View style={[styles.footer, { paddingBottom: Platform.OS === 'android' ? 32 + insets.bottom : 32 }]}>
            <View style={styles.dots}>
              <View style={[styles.dot, { backgroundColor: colors.border }]} />
              <View style={[styles.dot, { backgroundColor: colors.border }]} />
              <View style={[styles.dot, { backgroundColor: colors.border }]} />
              <View style={[styles.dot, styles.dotActive, { backgroundColor: colors.primary }]} />
              <View style={[styles.dot, { backgroundColor: colors.border }]} />
            </View>

            <View style={styles.langButtons}>
              <Button
                label={`🇷🇺 ${t('onboarding.langRu')}`}
                variant="primary"
                size="lg"
                onPress={() => selectLanguage('ru')}
              />
              <Button
                label={`🇬🇧 ${t('onboarding.langEn')}`}
                variant="secondary"
                size="lg"
                onPress={() => selectLanguage('en')}
              />
            </View>
          </View>
        </AnimatedEntrance>
      </LinearGradient>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: s(32),
  },
  illustrationWrapper: {
    alignItems: 'center',
    marginBottom: s(32),
  },
  illustration: {
    width: s(180),
    height: s(180),
    borderRadius: s(90),
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
  footer: { paddingHorizontal: s(16), paddingBottom: s(32), gap: s(16) },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: s(8) },
  dot: { width: s(8), height: s(8), borderRadius: s(4) },
  dotActive: { width: s(24), borderRadius: s(4) },
  langButtons: { gap: s(12) },
});
