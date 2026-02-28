import React from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Screen } from '@/components/layout/Screen';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { AnimatedEntrance } from '@/components/ui/AnimatedEntrance';
import { SettingsRow } from '@/features/settings/components/SettingsRow';
import { useSettings } from '@/features/settings/hooks/useSettings';
import { useThemeContext } from '@/theme';
import { fontFamily } from '@/theme/typography';
import { APP_VERSION } from '@/constants/config';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { colors, spacing } = useThemeContext();
  const { t } = useTranslation();
  const router = useRouter();
  const settings = useSettings();

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        <View style={[styles.header, { paddingTop: insets.top }]}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Feather name="chevron-left" size={24} color={colors.primary} />
            <Text style={[styles.backText, { color: colors.primary }]}>{t('common.back')}</Text>
          </Pressable>
          <Text style={[styles.largeTitle, { color: colors.textPrimary }]}>
            {t('settings.title')}
          </Text>
        </View>

        <AnimatedEntrance delay={0}>
          <Card variant="default" style={{ padding: 0, marginTop: spacing.lg }}>
            <SettingsRow
              icon={<Feather name="globe" size={18} color={colors.blue} />}
              iconBgColor={colors.blue + '15'}
              title={t('settings.interfaceLanguage')}
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
              icon={<MaterialCommunityIcons name="translate" size={18} color={colors.primary} />}
              iconBgColor={colors.primary + '15'}
              title={t('settings.contentLanguage')}
            />
            <View style={styles.chipRow}>
              <Chip
                label="🇷🇺 Русский"
                variant="primary"
                selected={settings.contentLanguage === 'ru'}
                onPress={() => settings.changeContentLanguage('ru')}
              />
              <Chip
                label="🇬🇧 English"
                variant="primary"
                selected={settings.contentLanguage === 'en'}
                onPress={() => settings.changeContentLanguage('en')}
              />
              <Chip
                label={t('settings.contentBoth')}
                variant="primary"
                selected={settings.contentLanguage === 'both'}
                onPress={() => settings.changeContentLanguage('both')}
              />
            </View>

            <SettingsRow
              icon={<MaterialCommunityIcons name="theme-light-dark" size={18} color={colors.purple} />}
              iconBgColor={colors.purple + '15'}
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
        </AnimatedEntrance>

        <AnimatedEntrance delay={100}>
          <Card variant="default" style={{ padding: 0, marginTop: spacing.lg }}>
            <SettingsRow
              icon={<Feather name="volume-2" size={18} color={colors.orange} />}
              iconBgColor={colors.orange + '15'}
              title={t('settings.sound')}
              isSwitch
              switchValue={settings.soundEnabled}
              onSwitchChange={settings.setSoundEnabled}
            />
            <SettingsRow
              icon={<MaterialCommunityIcons name="vibrate" size={18} color={colors.purple} />}
              iconBgColor={colors.purple + '15'}
              title={t('settings.haptics')}
              isSwitch
              switchValue={settings.hapticsEnabled}
              onSwitchChange={settings.setHapticsEnabled}
            />
            <SettingsRow
              icon={<Feather name="bell" size={18} color={colors.primary} />}
              iconBgColor={colors.primary + '15'}
              title={t('settings.notifications')}
              isSwitch
              switchValue={settings.notificationsEnabled}
              onSwitchChange={settings.toggleNotifications}
            />
          </Card>
        </AnimatedEntrance>

        <AnimatedEntrance delay={200}>
          <Card variant="default" style={{ padding: 0, marginTop: spacing.lg }}>
            <SettingsRow
              icon={<Feather name="info" size={18} color={colors.textSecondary} />}
              iconBgColor={colors.textSecondary + '15'}
              title={t('settings.version')}
              value={APP_VERSION}
            />
          </Card>
        </AnimatedEntrance>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    minHeight: 44,
    justifyContent: 'center',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    marginLeft: -6,
  },
  backText: {
    fontSize: 16,
    fontFamily: fontFamily.medium,
  },
  largeTitle: {
    fontSize: 32,
    fontFamily: fontFamily.bold,
    letterSpacing: -0.5,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
});
