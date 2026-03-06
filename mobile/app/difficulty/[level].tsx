import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, Switch } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { OverlayModal } from '@/components/feedback/OverlayModal';
import { Screen } from '@/components/layout/Screen';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { AnimatedEntrance } from '@/components/ui/AnimatedEntrance';
import { AdBanner } from '@/components/ads/AdBanner';
import { collectionsApi } from '@/features/collections/api/collectionsApi';
import { useGameStore } from '@/features/game/stores/useGameStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useThemeContext } from '@/theme';
import { fontFamily } from '@/theme/typography';
import { analytics } from '@/services/analytics';
import type { HomeFeed } from '@/shared';

const DIFFICULTY_CONFIG: Record<string, { icon: string; colorLight: string; colorDark: string; gradient: [string, string] }> = {
  easy: { icon: 'leaf', colorLight: '#22C55E', colorDark: '#4ADE80', gradient: ['#22C55E', '#16A34A'] },
  medium: { icon: 'flame', colorLight: '#F59E0B', colorDark: '#FBBF24', gradient: ['#F59E0B', '#D97706'] },
  hard: { icon: 'skull-outline', colorLight: '#EF4444', colorDark: '#F87171', gradient: ['#EF4444', '#DC2626'] },
};

export default function DifficultyDetailScreen() {
  const insets = useSafeAreaInsets();
  const { colors, spacing, elevation, isDark } = useThemeContext();
  const { t } = useTranslation();
  const router = useRouter();
  const { level } = useLocalSearchParams<{ level: string }>();
  const queryClient = useQueryClient();
  const startCollectionSession = useGameStore((s) => s.startCollectionSession);
  const replayWarningDismissed = useSettingsStore((s) => s.replayWarningDismissed);
  const setReplayWarningDismissed = useSettingsStore((s) => s.setReplayWarningDismissed);
  const [starting, setStarting] = useState(false);
  const [showReplayWarning, setShowReplayWarning] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const config = DIFFICULTY_CONFIG[level ?? ''] ?? DIFFICULTY_CONFIG.easy;
  const accentColor = isDark ? config.colorDark : config.colorLight;

  const cachedFeed = queryClient.getQueryData<HomeFeed>(['home', 'feed']);
  const progress = cachedFeed?.difficultyProgress?.[level ?? ''];
  const answeredCount = progress?.answeredCount ?? 0;
  const totalCount = progress?.totalCount ?? 0;
  const isCompleted = totalCount > 0 && answeredCount >= totalCount;
  const streak = cachedFeed?.userProgress?.streak ?? 0;

  const doStart = useCallback(async (replay: boolean) => {
    if (!level || starting) return;
    setStarting(true);
    try {
      const session = await collectionsApi.start({
        type: 'difficulty',
        difficulty: level as 'easy' | 'medium' | 'hard',
        count: 25,
        ...(replay ? { replay: true } : {}),
      });
      startCollectionSession(session.sessionId, 'difficulty', session.questions.length, session.questions, replay, streak);
      analytics.logEvent('collection_start', { type: 'difficulty', referenceId: level, questionCount: session.questions.length, replay });
      router.push({ pathname: '/game/card', params: { mode: 'collection' } });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error';
    } finally {
      setStarting(false);
    }
  }, [level, starting, startCollectionSession, router, streak]);

  const handleStart = useCallback(() => {
    if (isCompleted) {
      if (replayWarningDismissed) {
        doStart(true);
      } else {
        setShowReplayWarning(true);
      }
    } else {
      doStart(false);
    }
  }, [isCompleted, replayWarningDismissed, doStart]);

  const handleConfirmReplay = useCallback(() => {
    if (dontShowAgain) {
      setReplayWarningDismissed(true);
    }
    setShowReplayWarning(false);
    doStart(true);
  }, [dontShowAgain, setReplayWarningDismissed, doStart]);

  return (
    <Screen padded={false} backgroundColor={isDark ? colors.background : accentColor + '25'}>
      <AnimatedEntrance delay={0}>
        <LinearGradient
          colors={isDark
            ? [accentColor + '20', accentColor + '08', 'transparent']
            : [accentColor + '25', accentColor + '08', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={[styles.heroHeader, { paddingTop: insets.top + 24 }]}
        >
          <View style={[styles.iconCircle, { backgroundColor: accentColor + '20', ...elevation.md }]}>
            <MaterialCommunityIcons name={config.icon as any} size={44} color={accentColor} />
          </View>
          <Text style={[styles.title, { color: colors.textPrimary }]}>
            {t(`home.${level}`)}
          </Text>
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            {t(`home.${level}Desc`)}
          </Text>
        </LinearGradient>
      </AnimatedEntrance>

      <View style={[styles.content, { paddingHorizontal: spacing.screenPadding }]}>
        <AnimatedEntrance delay={100}>
          <Card variant="default" style={styles.infoCard}>
            <Text style={[styles.progressLabel, { color: colors.textSecondary }]}>
              {t('category.solvedOf', { solved: answeredCount, total: totalCount })}
            </Text>
            <View style={[styles.progressBarBg, { backgroundColor: colors.border }]}>
              <View
                style={[
                  styles.progressBarFill,
                  {
                    backgroundColor: accentColor,
                    width: totalCount > 0 ? `${(answeredCount / totalCount) * 100}%` : '0%',
                  },
                ]}
              />
            </View>
          </Card>
        </AnimatedEntrance>

        {isCompleted && (
          <AnimatedEntrance delay={200}>
            <Card variant="default" style={styles.completedCard}>
              <View style={styles.completedRow}>
                <View style={[styles.infoIconBg, { backgroundColor: colors.gold + '15' }]}>
                  <Feather name="award" size={18} color={colors.gold} />
                </View>
                <Text style={[styles.completedTitle, { color: colors.gold }]}>
                  {t('category.allDone')}
                </Text>
              </View>
            </Card>
          </AnimatedEntrance>
        )}
      </View>

      <View style={{ paddingHorizontal: spacing.screenPadding, marginBottom: 8 }}>
        <AdBanner placement="category" />
      </View>

      <AnimatedEntrance delay={300}>
        <View style={[styles.footer, { paddingHorizontal: spacing.screenPadding }]}>
          <Button
            label={isCompleted ? t('category.playAgain') : t('category.start')}
            variant="primary"
            size="lg"
            onPress={handleStart}
            loading={starting}
            iconLeft={<Feather name={isCompleted ? 'rotate-ccw' : 'play'} size={18} color="#FFFFFF" />}
          />
          <Button
            label={t('common.back')}
            variant="secondary"
            size="lg"
            onPress={() => router.back()}
          />
        </View>
      </AnimatedEntrance>

      <OverlayModal visible={showReplayWarning} onClose={() => setShowReplayWarning(false)}>
        <View style={[styles.replayModal, { backgroundColor: colors.surface, borderRadius: 20 }]}>
          <Text style={[styles.replayTitle, { color: colors.textPrimary }]}>
            {t('category.replayTitle')}
          </Text>
          <Text style={[styles.replayDesc, { color: colors.textSecondary }]}>
            {t('category.replayDesc')}
          </Text>
          <Pressable onPress={() => setDontShowAgain(!dontShowAgain)} style={styles.replayCheckRow}>
            <Switch value={dontShowAgain} onValueChange={setDontShowAgain} trackColor={{ true: colors.primary }} />
            <Text style={[styles.replayCheckLabel, { color: colors.textSecondary }]}>
              {t('category.dontShow')}
            </Text>
          </Pressable>
          <View style={styles.replayButtons}>
            <Pressable onPress={() => setShowReplayWarning(false)} style={[styles.replayBtn, { backgroundColor: colors.surfaceVariant }]}>
              <Text style={[styles.replayBtnText, { color: colors.textPrimary }]}>{t('common.cancel')}</Text>
            </Pressable>
            <Pressable onPress={handleConfirmReplay} style={[styles.replayBtn, { backgroundColor: colors.primary }]}>
              <Text style={[styles.replayBtnText, { color: '#FFFFFF' }]}>{t('category.start')}</Text>
            </Pressable>
          </View>
        </View>
      </OverlayModal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  heroHeader: {
    alignItems: 'center',
    gap: 10,
    paddingTop: 24,
    paddingBottom: 28,
    paddingHorizontal: 32,
  },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 26,
    fontFamily: fontFamily.bold,
    lineHeight: 32,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  description: {
    fontSize: 15,
    fontFamily: fontFamily.regular,
    lineHeight: 22,
    textAlign: 'center',
  },
  content: { flex: 1, gap: 16 },
  infoCard: { paddingVertical: 18, paddingHorizontal: 20, gap: 10 },
  progressLabel: { fontSize: 14, fontFamily: fontFamily.semiBold },
  progressBarBg: { height: 8, borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 4 },
  infoIconBg: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  completedCard: { paddingVertical: 14, paddingHorizontal: 16 },
  completedRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  completedTitle: { fontSize: 15, fontFamily: fontFamily.bold },
  footer: { paddingBottom: 32, gap: 12 },
  replayModal: { width: '100%', padding: 24 },
  replayTitle: { fontSize: 20, fontFamily: fontFamily.bold, textAlign: 'center', marginBottom: 8 },
  replayDesc: { fontSize: 15, fontFamily: fontFamily.regular, textAlign: 'center', lineHeight: 22, marginBottom: 20 },
  replayCheckRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 },
  replayCheckLabel: { fontSize: 14, fontFamily: fontFamily.regular, flex: 1, marginLeft: 10 },
  replayButtons: { flexDirection: 'row', gap: 12 },
  replayBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  replayBtnText: { fontSize: 15, fontFamily: fontFamily.semiBold },
});
