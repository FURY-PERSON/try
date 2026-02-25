import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
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
          <View style={styles.footer}>
            <View style={styles.dots}>
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
    paddingHorizontal: 32,
  },
  illustrationWrapper: {
    alignItems: 'center',
    marginBottom: 32,
  },
  illustration: {
    width: 180,
    height: 180,
    borderRadius: 90,
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
  footer: { paddingHorizontal: 16, paddingBottom: 32, gap: 16 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  dotActive: { width: 24, borderRadius: 4 },
  langButtons: { gap: 12 },
});
