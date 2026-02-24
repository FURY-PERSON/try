import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Screen } from '@/components/layout/Screen';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { AnimatedEntrance } from '@/components/ui/AnimatedEntrance';
import { useUserStore } from '@/stores/useUserStore';
import { profileApi } from '@/features/profile/api/profileApi';
import { useThemeContext } from '@/theme';
import { fontFamily } from '@/theme/typography';
import { analytics } from '@/services/analytics';

export default function NicknameModal() {
  const insets = useSafeAreaInsets();
  const { colors, spacing, borderRadius } = useThemeContext();
  const { t } = useTranslation();
  const router = useRouter();
  const currentNickname = useUserStore((s) => s.nickname);
  const setNickname = useUserStore((s) => s.setNickname);
  const [value, setValue] = useState(currentNickname ?? '');
  const [loading, setLoading] = useState(false);

  const isValid = value.length >= 3 && value.length <= 16;

  const handleSave = async () => {
    if (!isValid) return;
    setLoading(true);
    try {
      await profileApi.updateProfile({ nickname: value });
      setNickname(value);
      analytics.logEvent('nickname_set');
      router.back();
    } catch {
      // Keep current value
      setNickname(value);
      router.back();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.content}>
        <AnimatedEntrance delay={0} direction="up">
          <View style={[styles.iconContainer, { backgroundColor: colors.primary + '15' }]}>
            <Feather name="edit-3" size={32} color={colors.primary} />
          </View>
        </AnimatedEntrance>

        <AnimatedEntrance delay={100} direction="up">
          <Text style={[styles.title, { color: colors.textPrimary }]}>
            {t('nickname.title')}
          </Text>
        </AnimatedEntrance>

        <AnimatedEntrance delay={200} direction="up">
          <Input
            variant="answer"
            value={value}
            onChangeText={setValue}
            placeholder={t('nickname.placeholder')}
            autoFocus
            maxLength={16}
          />
        </AnimatedEntrance>

        <AnimatedEntrance delay={300} direction="up">
          <Text style={[styles.hint, { color: colors.textTertiary }]}>
            {t('nickname.hint')}
          </Text>
        </AnimatedEntrance>
      </View>

      <AnimatedEntrance delay={400} direction="up">
        <View style={styles.footer}>
          <Button
            label={t('common.save')}
            variant="primary"
            size="lg"
            disabled={!isValid}
            loading={loading}
            onPress={handleSave}
          />
          <Button
            label={t('common.cancel')}
            variant="ghost"
            size="md"
            onPress={() => router.back()}
          />
        </View>
      </AnimatedEntrance>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { justifyContent: 'space-between' },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 20,
    alignItems: 'center',
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 28,
    fontFamily: fontFamily.extraBold,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  hint: {
    fontSize: 13,
    fontFamily: fontFamily.regular,
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    gap: 8,
  },
});
