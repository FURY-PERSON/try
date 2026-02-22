import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Screen } from '@/components/layout/Screen';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { AdBanner } from '@/components/ads/AdBanner';
import { useThemeContext } from '@/theme';

const GAME_MODES = [
  { key: 'anagram', icon: 'shuffle-variant', route: '/game/anagram' },
  { key: 'compose', icon: 'alphabetical-variant', route: '/game/compose' },
  { key: 'chain', icon: 'link-variant', route: '/game/chain' },
  { key: 'search', icon: 'magnify', route: '/game/search' },
  { key: 'guess', icon: 'help-circle-outline', route: '/game/guess' },
] as const;

export default function InfiniteScreen() {
  const { colors, spacing } = useThemeContext();
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>♾️ {t('tabs.infinite')}</Text>
      </View>

      <View style={styles.grid}>
        {GAME_MODES.map((mode) => (
          <Card
            key={mode.key}
            variant="flat"
            onPress={() => router.push(mode.route)}
            style={styles.modeCard}
          >
            <View style={styles.modeContent}>
              <MaterialCommunityIcons
                name={mode.icon as keyof typeof MaterialCommunityIcons.glyphMap}
                size={32}
                color={colors.blue}
              />
              <Text style={[styles.modeName, { color: colors.textPrimary }]}>
                {t(`game.${mode.key}`)}
              </Text>
              <Text style={[styles.modeDesc, { color: colors.textSecondary }]}>
                {t(`game.${mode.key}Desc`)}
              </Text>
            </View>
          </Card>
        ))}
      </View>

      <View style={{ marginTop: spacing.sectionGap }}>
        <Button
          label={`🎲 ${t('common.play')}`}
          variant="blue"
          size="lg"
          onPress={() => {
            const random = GAME_MODES[Math.floor(Math.random() * GAME_MODES.length)];
            if (random) router.push(random.route);
          }}
        />
      </View>

      <View style={{ marginTop: spacing.sectionGap }}>
        <AdBanner placement="infinite_bottom" />
      </View>
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
  grid: {
    gap: 12,
    marginTop: 16,
  },
  modeCard: {
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  modeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  modeName: {
    fontSize: 16,
    fontFamily: 'Nunito_700Bold',
    flex: 1,
  },
  modeDesc: {
    fontSize: 13,
    fontFamily: 'Nunito_400Regular',
  },
});
