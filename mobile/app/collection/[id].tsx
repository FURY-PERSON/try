import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, Switch, Platform } from 'react-native';
import { OverlayModal } from '@/components/feedback/OverlayModal';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { HomeFeed } from '@/shared';
import { useTranslation } from 'react-i18next';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Screen } from '@/components/layout/Screen';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/feedback/Skeleton';
import { AnimatedEntrance } from '@/components/ui/AnimatedEntrance';
import { IconFromName } from '@/components/ui/IconFromName';
import { AdBanner } from '@/components/ads/AdBanner';
import { collectionsApi } from '@/features/collections/api/collectionsApi';
import { useGameStore } from '@/features/game/stores/useGameStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useThemeContext } from '@/theme';
import { fontFamily } from '@/theme/typography';
import { analytics } from '@/services/analytics';
import { showToast } from '@/stores/useToastStore';

export default function CollectionDetailScreen() {
  const insets = useSafeAreaInsets();
  const { colors, spacing, borderRadius, elevation, isDark } = useThemeContext();
  const { t } = useTranslation();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const language = useSettingsStore((s) => s.language);
  const replayWarningDismissed = useSettingsStore((s) => s.replayWarningDismissed);
  const setReplayWarningDismissed = useSettingsStore((s) => s.setReplayWarningDismissed);
  const queryClient = useQueryClient();
  const startCollectionSession = useGameStore((s) => s.startCollectionSession);
  const [starting, setStarting] = useState(false);
  const [showReplayWarning, setShowReplayWarning] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const { data: collection, isLoading, isError } = useQuery({
    queryKey: ['collection', id],
    queryFn: () => collectionsApi.getById(id!),
    enabled: !!id,
  });

  React.useEffect(() => {
    if (id) {
      analytics.logEvent('collection_detail_viewed', { collectionId: id });
    }
  }, [id]);

  const title = collection
    ? language === 'en'
      ? (collection.titleEn || collection.title)
      : collection.title
    : '';
  const description = collection
    ? language === 'en'
      ? (collection.descriptionEn || collection.description)
      : collection.description
    : '';

  const accentColor = colors.primary;

  const doStart = useCallback(async (replay: boolean) => {
    if (!id || starting) return;
    setStarting(true);
    try {
      const session = await collectionsApi.start({
        type: 'collection',
        collectionId: id,
        count: 30,
        ...(replay ? { replay: true } : {}),
      });
      const cachedFeed = queryClient.getQueryData<HomeFeed>(['home', 'feed']);
      const streak = cachedFeed?.userProgress?.streak ?? 0;
      startCollectionSession(session.sessionId, 'collection', session.questions.length, session.questions, replay, streak);
      analytics.logEvent('collection_start', {
        type: 'collection',
        referenceId: id,
        questionCount: session.questions.length,
        replay,
      });
      router.push({ pathname: '/game/card', params: { mode: 'collection' } });
    } catch (err) {
      showToast(err instanceof Error ? err.message : t('error.generic'));
    } finally {
      setStarting(false);
    }
  }, [id, starting, startCollectionSession, router]);

  const handleStart = useCallback(() => {
    if (collection?.completed) {
      if (replayWarningDismissed) {
        doStart(true);
      } else {
        setShowReplayWarning(true);
      }
    } else {
      doStart(false);
    }
  }, [collection?.completed, replayWarningDismissed, doStart]);

  const handleConfirmReplay = useCallback(() => {
    if (dontShowAgain) {
      setReplayWarningDismissed(true);
    }
    setShowReplayWarning(false);
    doStart(true);
  }, [dontShowAgain, setReplayWarningDismissed, doStart]);

  if (isLoading) {
    return (
      <Screen style={{ paddingTop: insets.top }}>
        <View style={styles.center}>
          <Skeleton width={80} height={80} shape="rectangle" />
          <Skeleton width="60%" height={28} shape="rectangle" style={{ marginTop: 16 }} />
          <Skeleton width="80%" height={16} shape="rectangle" style={{ marginTop: 8 }} />
        </View>
      </Screen>
    );
  }

  if (isError || !collection) {
    return (
      <Screen style={{ paddingTop: insets.top }}>
        <View style={styles.center}>
          <Text style={[styles.errorText, { color: colors.textSecondary }]}>
            {t('collection.notFound')}
          </Text>
          <Button
            label={t('common.back')}
            variant="secondary"
            size="md"
            onPress={() => router.back()}
          />
        </View>
      </Screen>
    );
  }

  const totalCount = collection._count.questions;
  const answeredCount = collection.completed ? totalCount : 0;

  return (
    <Screen padded={false} backgroundColor={isDark ? colors.background : accentColor + '25'}>
      {/* Gradient Hero Header */}
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
            <IconFromName name={collection.icon} size={44} color={accentColor} />
          </View>
          <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
          {description ? (
            <Text style={[styles.description, { color: colors.textSecondary }]}>
              {description}
            </Text>
          ) : null}
        </LinearGradient>
      </AnimatedEntrance>

      <View style={[styles.content, { paddingHorizontal: spacing.screenPadding }]}>
        {/* Progress */}
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
                    width: totalCount > 0
                      ? `${(answeredCount / totalCount) * 100}%`
                      : '0%',
                  },
                ]}
              />
            </View>
          </Card>
        </AnimatedEntrance>

        {/* Last result */}
        {collection.lastResult && (
          <AnimatedEntrance delay={200}>
            <Card variant="default" style={styles.completedCard}>
              <View style={styles.completedRow}>
                <View style={[styles.infoIconBg, { backgroundColor: colors.emerald + '15' }]}>
                  <Feather name="check-circle" size={18} color={colors.emerald} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.completedTitle, { color: colors.emerald }]}>
                    {t('collection.completed')}
                  </Text>
                  <Text style={[styles.completedResult, { color: colors.textSecondary }]}>
                    {t('collection.lastScore', {
                      correct: collection.lastResult.correctAnswers,
                      total: collection.lastResult.totalQuestions,
                    })}
                  </Text>
                </View>
              </View>
            </Card>
          </AnimatedEntrance>
        )}

        {/* All done */}
        {collection.completed && (
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

      {/* Ad Banner above buttons */}
      <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: spacing.screenPadding, marginBottom: 8 }}>
        <AdBanner placement="category" size="adaptive" />
      </View>

      {/* Footer */}
      <AnimatedEntrance delay={300}>
        <View style={[styles.footer, { paddingHorizontal: spacing.screenPadding, paddingBottom: Platform.OS === 'android' ? 32 + insets.bottom : 32 }]}>
          <Button
            label={collection.completed ? t('category.playAgain') : t('category.start')}
            variant="primary"
            size="lg"
            onPress={handleStart}
            loading={starting}
            iconLeft={<Feather name={collection.completed ? 'rotate-ccw' : 'play'} size={18} color="#FFFFFF" />}
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
          <Pressable
            onPress={() => setDontShowAgain(!dontShowAgain)}
            style={styles.replayCheckRow}
          >
            <Switch
              value={dontShowAgain}
              onValueChange={setDontShowAgain}
              trackColor={{ true: colors.primary }}
            />
            <Text style={[styles.replayCheckLabel, { color: colors.textSecondary }]}>
              {t('category.dontShow')}
            </Text>
          </Pressable>
          <View style={styles.replayButtons}>
            <Pressable
              onPress={() => setShowReplayWarning(false)}
              style={[styles.replayBtn, { backgroundColor: colors.surfaceVariant }]}
            >
              <Text style={[styles.replayBtnText, { color: colors.textPrimary }]}>
                {t('common.cancel')}
              </Text>
            </Pressable>
            <Pressable
              onPress={handleConfirmReplay}
              style={[styles.replayBtn, { backgroundColor: colors.primary }]}
            >
              <Text style={[styles.replayBtnText, { color: '#FFFFFF' }]}>
                {t('category.start')}
              </Text>
            </Pressable>
          </View>
        </View>
      </OverlayModal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
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
  content: {
    gap: 16,
  },
  infoCard: {
    paddingVertical: 18,
    paddingHorizontal: 20,
    gap: 10,
  },
  progressLabel: {
    fontSize: 14,
    fontFamily: fontFamily.semiBold,
  },
  progressBarBg: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  infoIconBg: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completedCard: {
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  completedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  completedTitle: {
    fontSize: 15,
    fontFamily: fontFamily.bold,
  },
  completedResult: {
    fontSize: 13,
    fontFamily: fontFamily.regular,
    marginTop: 2,
  },
  errorText: {
    fontSize: 16,
    fontFamily: fontFamily.medium,
  },
  footer: {
    paddingBottom: 32,
    gap: 12,
  },
  replayModal: {
    width: '100%',
    padding: 24,
  },
  replayTitle: {
    fontSize: 20,
    fontFamily: fontFamily.bold,
    textAlign: 'center',
    marginBottom: 8,
  },
  replayDesc: {
    fontSize: 15,
    fontFamily: fontFamily.regular,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  replayCheckRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
  },
  replayCheckLabel: {
    fontSize: 14,
    fontFamily: fontFamily.regular,
    flex: 1,
    marginLeft: 10,
  },
  replayButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  replayBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  replayBtnText: {
    fontSize: 15,
    fontFamily: fontFamily.semiBold,
  },
});
