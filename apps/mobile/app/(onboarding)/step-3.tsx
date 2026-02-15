import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Screen } from '@/components/layout/Screen';
import { Button } from '@/components/ui/Button';
import { useOnboarding } from '@/features/onboarding/hooks/useOnboarding';
import { useThemeContext } from '@/theme';

export default function OnboardingStep3() {
  const { colors } = useThemeContext();
  const { t } = useTranslation();
  const { finish } = useOnboarding();

  return (
    <Screen>
      <View style={styles.container}>
        <View style={styles.content}>
          <View style={[styles.illustration, { backgroundColor: colors.gold + '33' }]}>
            <MaterialCommunityIcons name="translate" size={80} color={colors.gold} />
          </View>

          <Text style={[styles.title, { color: colors.textPrimary }]}>
            {t('onboarding.step3Title')}
          </Text>
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            {t('onboarding.step3Desc')}
          </Text>
        </View>

        <View style={styles.footer}>
          <View style={styles.dots}>
            <View style={[styles.dot, { backgroundColor: colors.border }]} />
            <View style={[styles.dot, { backgroundColor: colors.border }]} />
            <View style={[styles.dot, { backgroundColor: colors.primary }]} />
          </View>

          <View style={styles.langButtons}>
            <Button
              label={`🇷🇺 ${t('onboarding.langRu')}`}
              variant="secondary"
              size="lg"
              onPress={() => finish('ru')}
            />
            <Button
              label={`🇬🇧 ${t('onboarding.langEn')}`}
              variant="secondary"
              size="lg"
              onPress={() => finish('en')}
            />
          </View>
        </View>
      </View>
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
  illustration: {
    width: 200,
    height: 200,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
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
  footer: { paddingHorizontal: 16, paddingBottom: 32, gap: 16 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  langButtons: { gap: 12 },
});
