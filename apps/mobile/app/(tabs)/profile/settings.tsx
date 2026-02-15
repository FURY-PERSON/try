import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { Screen } from '@/components/layout/Screen';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { SettingsRow } from '@/features/settings/components/SettingsRow';
import { useSettings } from '@/features/settings/hooks/useSettings';
import { useThemeContext } from '@/theme';
import { APP_VERSION } from '@/constants/config';

export default function SettingsScreen() {
  const { colors, spacing } = useThemeContext();
  const { t } = useTranslation();
  const router = useRouter();
  const settings = useSettings();

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>
            {t('settings.title')}
          </Text>
        </View>

        <Card variant="flat" style={{ padding: 0, marginTop: spacing.lg }}>
          <SettingsRow
            icon={<Feather name="globe" size={20} color={colors.blue} />}
            title={t('settings.language')}
          />
          <View style={styles.chipRow}>
            <Chip
              label="🇷🇺 Русский"
              variant="primary"
              selected={settings.language === 'ru'}
              onPress={() => settings.changeLanguage('ru')}
            />
            <Chip
              label="🇬🇧 English"
              variant="primary"
              selected={settings.language === 'en'}
              onPress={() => settings.changeLanguage('en')}
            />
          </View>

          <SettingsRow
            icon={<MaterialCommunityIcons name="theme-light-dark" size={20} color={colors.purple} />}
            title={t('settings.theme')}
          />
          <View style={styles.chipRow}>
            <Chip
              label={t('settings.themeLight')}
              variant="primary"
              selected={settings.theme === 'light'}
              onPress={() => settings.changeTheme('light')}
            />
            <Chip
              label={t('settings.themeDark')}
              variant="primary"
              selected={settings.theme === 'dark'}
              onPress={() => settings.changeTheme('dark')}
            />
            <Chip
              label={t('settings.themeSystem')}
              variant="primary"
              selected={settings.theme === 'system'}
              onPress={() => settings.changeTheme('system')}
            />
          </View>
        </Card>

        <Card variant="flat" style={{ padding: 0, marginTop: spacing.lg }}>
          <SettingsRow
            icon={<Feather name="volume-2" size={20} color={colors.orange} />}
            title={t('settings.sound')}
            isSwitch
            switchValue={settings.soundEnabled}
            onSwitchChange={settings.setSoundEnabled}
          />
          <SettingsRow
            icon={<MaterialCommunityIcons name="vibrate" size={20} color={colors.purple} />}
            title={t('settings.haptics')}
            isSwitch
            switchValue={settings.hapticsEnabled}
            onSwitchChange={settings.setHapticsEnabled}
          />
          <SettingsRow
            icon={<Feather name="bell" size={20} color={colors.primary} />}
            title={t('settings.notifications')}
            isSwitch
            switchValue={settings.notificationsEnabled}
            onSwitchChange={settings.toggleNotifications}
          />
        </Card>

        <Card variant="flat" style={{ padding: 0, marginTop: spacing.lg }}>
          <SettingsRow
            icon={<Feather name="info" size={20} color={colors.textSecondary} />}
            title={t('settings.version')}
            value={APP_VERSION}
          />
        </Card>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 56,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontFamily: 'Nunito_800ExtraBold',
  },
  chipRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
});
