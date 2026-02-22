import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Screen } from '@/components/layout/Screen';
import { Button } from '@/components/ui/Button';
import { useOnboarding } from '@/features/onboarding/hooks/useOnboarding';
import { useThemeContext } from '@/theme';

export default function OnboardingStep2() {
  const { colors } = useThemeContext();
  const { t } = useTranslation();
  const router = useRouter();
  const { skip } = useOnboarding();

  return (
    <Screen>
      <View style={styles.container}>
        <Pressable onPress={skip} style={styles.skipButton}>
          <Text style={[styles.skipText, { color: colors.textSecondary }]}>
            {t('common.skip')} →
          </Text>
        </Pressable>

        <View style={styles.content}>
          <View style={[styles.illustration, { backgroundColor: colors.blue + '33' }]}>
            <MaterialCommunityIcons name="gesture-swipe" size={80} color={colors.blue} />
          </View>

          <Text style={[styles.title, { color: colors.textPrimary }]}>
            {t('onboarding.step2Title')}
          </Text>
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            {t('onboarding.step2Desc')}
          </Text>
        </View>

        <View style={styles.footer}>
          <View style={styles.dots}>
            <View style={[styles.dot, { backgroundColor: colors.border }]} />
            <View style={[styles.dot, { backgroundColor: colors.primary }]} />
            <View style={[styles.dot, { backgroundColor: colors.border }]} />
          </View>
          <Button
            label={t('common.continue')}
            variant="primary"
            size="lg"
            onPress={() => router.push('/(onboarding)/step-3')}
          />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  skipButton: { alignSelf: 'flex-end', padding: 16 },
  skipText: { fontSize: 15, fontFamily: 'Nunito_700Bold' },
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
});
