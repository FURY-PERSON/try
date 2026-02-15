import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Screen } from '@/components/layout/Screen';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useUserStore } from '@/stores/useUserStore';
import { profileApi } from '@/features/profile/api/profileApi';
import { useThemeContext } from '@/theme';
import { analytics } from '@/services/analytics';

export default function NicknameModal() {
  const { colors } = useThemeContext();
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
    <Screen edges={['bottom', 'left', 'right']} style={styles.screen}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>
          {t('nickname.title')}
        </Text>

        <Input
          variant="answer"
          value={value}
          onChangeText={setValue}
          placeholder={t('nickname.placeholder')}
          autoFocus
          maxLength={16}
        />

        <Text style={[styles.hint, { color: colors.textSecondary }]}>
          {t('nickname.hint')}
        </Text>
      </View>

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
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { justifyContent: 'space-between' },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 16,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Nunito_800ExtraBold',
    textAlign: 'center',
  },
  hint: {
    fontSize: 13,
    fontFamily: 'Nunito_400Regular',
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    gap: 8,
  },
});
