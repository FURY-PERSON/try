import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Screen } from '@/components/layout/Screen';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { AnimatedEntrance } from '@/components/ui/AnimatedEntrance';
import { AdBanner } from '@/components/ads/AdBanner';
import { collectionsApi } from '@/features/collections/api/collectionsApi';
import { useGameStore } from '@/features/game/stores/useGameStore';
import { useThemeContext } from '@/theme';
import { fontFamily } from '@/theme/typography';
import { analytics } from '@/services/analytics';
import { showToast } from '@/stores/useToastStore';
import type { HomeFeed } from '@/shared';
import { s } from '@/utils/scale';

// Static gradient point objects — avoids per-render allocation
const GRADIENT_START = { x: 0, y: 0 } as const;
const GRADIENT_END_V = { x: 0, y: 1 } as const;

export default function RandomFactsScreen() {
  const insets = useSafeAreaInsets();
  const { colors, spacing, gradients, elevation, isDark } = useThemeContext();
  const { t } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();
  const startCollectionSession = useGameStore((s) => s.startCollectionSession);
  const [starting, setStarting] = useState(false);

  const accentColor = isDark ? '#A78BFA' : '#7C3AED';

  const cachedFeed = queryClient.getQueryData<HomeFeed>(['home', 'feed']);
  const difficultyProgress = cachedFeed?.difficultyProgress;
  const totalAnswered = difficultyProgress
    ? Object.values(difficultyProgress).reduce((sum, p) => sum + (p?.answeredCount ?? 0), 0)
    : 0;
  const totalQuestions = difficultyProgress
    ? Object.values(difficultyProgress).reduce((sum, p) => sum + (p?.totalCount ?? 0), 0)
    : 0;
  const isCompleted = totalQuestions > 0 && totalAnswered >= totalQuestions;
  const streak = cachedFeed?.userProgress?.streak ?? 0;

  const doStart = useCallback(async (replay: boolean) => {
    if (starting) return;
    setStarting(true);
    try {
      const session = await collectionsApi.start({
        type: 'random',
        count: 30,
        ...(replay ? { replay: true } : {}),
      });
      startCollectionSession(session.sessionId, 'category', session.questions.length, session.questions, streak);
      analytics.logEvent('collection_start', { type: 'random', questionCount: session.questions.length, replay });
      router.push({ pathname: '/game/card', params: { mode: 'collection' } });
    } catch (err) {
      showToast(err instanceof Error ? err.message : t('error.generic'));
    } finally {
      setStarting(false);
    }
  }, [starting, startCollectionSession, router, streak]);

  const handleStart = useCallback(() => {
    doStart(isCompleted);
  }, [isCompleted, doStart]);

  return (
    <Screen padded={false} backgroundColor={isDark ? colors.background : accentColor + '25'}>
      <AnimatedEntrance delay={0}>
        <LinearGradient
          colors={isDark
            ? [accentColor + '20', accentColor + '08', 'transparent']
            : [accentColor + '25', accentColor + '08', 'transparent']}
          start={GRADIENT_START}
          end={GRADIENT_END_V}
          style={[styles.heroHeader, { paddingTop: insets.top + 24 }]}
        >
          <View style={[styles.iconCircle, { backgroundColor: accentColor + '20', ...elevation.md }]}>
            <Feather name="shuffle" size={44} color={accentColor} />
          </View>
          <Text style={[styles.title, { color: colors.textPrimary }]}>
            {t('home.randomFacts')}
          </Text>
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            {t('home.randomFactsDesc')}
          </Text>
        </LinearGradient>
      </AnimatedEntrance>

      <View style={[styles.content, { paddingHorizontal: spacing.screenPadding }]}>
        <AnimatedEntrance delay={100}>
          <Card variant="default" style={styles.infoCard}>
            <Text style={[styles.progressLabel, { color: colors.textSecondary }]}>
              {t('category.solvedOf', { solved: totalAnswered, total: totalQuestions })}
            </Text>
            <View style={[styles.progressBarBg, { backgroundColor: colors.border }]}>
              <View
                style={[
                  styles.progressBarFill,
                  {
                    backgroundColor: accentColor,
                    width: totalQuestions > 0 ? `${(totalAnswered / totalQuestions) * 100}%` : '0%',
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

      <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: spacing.screenPadding, marginBottom: 8 }}>
        <AdBanner placement="category" size="adaptive" />
      </View>

      <AnimatedEntrance delay={300}>
        <View style={[styles.footer, { paddingHorizontal: spacing.screenPadding, paddingBottom: Platform.OS === 'android' ? 32 + insets.bottom : 32 }]}>
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

    </Screen>
  );
}

const styles = StyleSheet.create({
  heroHeader: {
    alignItems: 'center',
    gap: s(10),
    paddingTop: s(24),
    paddingBottom: s(28),
    paddingHorizontal: s(32),
  },
  iconCircle: {
    width: s(88),
    height: s(88),
    borderRadius: s(44),
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: s(26),
    fontFamily: fontFamily.bold,
    lineHeight: s(32),
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  description: {
    fontSize: s(15),
    fontFamily: fontFamily.regular,
    lineHeight: s(22),
    textAlign: 'center',
  },
  content: { gap: s(16) },
  infoCard: { paddingVertical: s(18), paddingHorizontal: s(20), gap: s(10) },
  progressLabel: { fontSize: s(14), fontFamily: fontFamily.semiBold },
  progressBarBg: { height: s(8), borderRadius: s(4), overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: s(4) },
  infoIconBg: { width: s(32), height: s(32), borderRadius: s(10), alignItems: 'center', justifyContent: 'center' },
  completedCard: { paddingVertical: s(14), paddingHorizontal: s(16) },
  completedRow: { flexDirection: 'row', alignItems: 'center', gap: s(12) },
  completedTitle: { fontSize: s(15), fontFamily: fontFamily.bold },
  footer: { paddingBottom: s(32), gap: s(12) },
});
