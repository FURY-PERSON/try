import React from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Linking } from 'react-native';
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
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useThemeContext } from '@/theme';
import { fontFamily } from '@/theme/typography';
import { APP_VERSION, PRIVACY_POLICY_URL } from '@/constants/config';
import { useFloatingTabBarHeight } from '@/components/navigation/FloatingTabBar';
import { s } from '@/utils/scale';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useFloatingTabBarHeight();
  const { colors, spacing } = useThemeContext();
  const { t } = useTranslation();
  const router = useRouter();
  const settings = useSettings();
  const language = useSettingsStore((s) => s.language);

  const openPrivacyPolicy = () => {
    const url = language === 'ru'
      ? PRIVACY_POLICY_URL.replace(/\/?$/, '/ru.html')
      : PRIVACY_POLICY_URL.replace(/\/?$/, '/en.html');
    Linking.openURL(url);
  };

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: tabBarHeight + 16 }}>
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
              icon={<Feather name="shield" size={18} color={colors.emerald} />}
              iconBgColor={colors.emerald + '15'}
              title={t('settings.privacyPolicy')}
              onPress={openPrivacyPolicy}
            />
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
    minHeight: s(44),
    justifyContent: 'center',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: s(8),
    marginLeft: -6,
  },
  backText: {
    fontSize: s(16),
    fontFamily: fontFamily.medium,
  },
  largeTitle: {
    fontSize: s(32),
    fontFamily: fontFamily.bold,
    letterSpacing: -0.5,
  },
  chipRow: {
    flexDirection: 'row',
    gap: s(8),
    paddingHorizontal: s(16),
    paddingBottom: s(14),
  },
});
