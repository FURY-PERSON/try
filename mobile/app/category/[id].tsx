import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, Switch } from 'react-native';
import { OverlayModal } from '@/components/feedback/OverlayModal';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Screen } from '@/components/layout/Screen';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/feedback/Skeleton';
import { AnimatedEntrance } from '@/components/ui/AnimatedEntrance';
import { IconFromName } from '@/components/ui/IconFromName';
import { categoriesApi } from '@/features/home/api/categoriesApi';
import { collectionsApi } from '@/features/collections/api/collectionsApi';
import { useGameStore } from '@/features/game/stores/useGameStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useThemeContext } from '@/theme';
import { fontFamily } from '@/theme/typography';
import { analytics } from '@/services/analytics';

export default function CategoryDetailScreen() {
  const insets = useSafeAreaInsets();
  const { colors, gradients, spacing, borderRadius, elevation, isDark } = useThemeContext();
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

  const { data: category, isLoading, isError } = useQuery({
    queryKey: ['category', id],
    queryFn: () => categoriesApi.getById(id!),
    enabled: !!id,
  });

  React.useEffect(() => {
    if (id) {
      analytics.logEvent('category_detail_viewed', { categoryId: id });
    }
  }, [id]);

  const name = category
    ? language === 'en'
      ? (category.nameEn || category.name)
      : category.name
    : '';
  const description = category
    ? language === 'en'
      ? (category.descriptionEn || category.description)
      : category.description
    : '';

  const doStart = useCallback(async (replay: boolean) => {
    if (!id || starting) return;
    setStarting(true);
    try {
      const session = await collectionsApi.start({
        type: 'category',
        categoryId: id,
        count: 30,
        ...(replay ? { replay: true } : {}),
      });
      startCollectionSession(session.sessionId, 'category', session.questions.length, session.questions, replay);
      analytics.logEvent('category_start', {
        type: 'category',
        referenceId: id,
        questionCount: session.questions.length,
        replay,
      });
      router.push({
        pathname: '/game/card',
        params: { mode: 'collection' },
      });
    } catch {
      // Refetch category to get fresh availableCount
      queryClient.invalidateQueries({ queryKey: ['category', id] });
    } finally {
      setStarting(false);
    }
  }, [id, starting, startCollectionSession, router]);

  const handleStart = useCallback(() => {
    doStart(false);
  }, [doStart]);

  const handleReplay = useCallback(() => {
    if (replayWarningDismissed) {
      doStart(true);
    } else {
      setShowReplayWarning(true);
    }
  }, [replayWarningDismissed, doStart]);

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

  if (isError || !category) {
    return (
      <Screen style={{ paddingTop: insets.top }}>
        <View style={styles.center}>
          <Text style={[styles.errorText, { color: colors.textSecondary }]}>
            {t('category.notFound')}
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

  const categoryColor = category.color || colors.primary;

  return (
    <Screen padded={false} backgroundColor={isDark ? colors.background : categoryColor + '25'}>
      {/* Gradient Hero Header */}
      <AnimatedEntrance delay={0}>
        <LinearGradient
          colors={isDark
            ? [categoryColor + '20', categoryColor + '08', 'transparent']
            : [categoryColor + '25', categoryColor + '08', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={[styles.heroHeader, { paddingTop: insets.top + 24 }]}
        >
          <View style={[styles.iconCircle, { backgroundColor: categoryColor + '20', ...elevation.md }]}>
            <IconFromName name={category.icon} size={44} color={categoryColor} />
          </View>
          <Text style={[styles.title, { color: colors.textPrimary }]}>{name}</Text>
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
              {t('category.solvedOf', { solved: category.totalCount - category.availableCount, total: category.totalCount })}
            </Text>
            <View style={[styles.progressBarBg, { backgroundColor: colors.border }]}>
              <View
                style={[
                  styles.progressBarFill,
                  {
                    backgroundColor: categoryColor,
                    width: category.totalCount > 0
                      ? `${((category.totalCount - category.availableCount) / category.totalCount) * 100}%`
                      : '0%',
                  },
                ]}
              />
            </View>
          </Card>
        </AnimatedEntrance>

        {/* Last result */}
        {category.lastResult && (
          <AnimatedEntrance delay={200}>
            <Card variant="default" style={styles.completedCard}>
              <View style={styles.completedRow}>
                <View style={[styles.infoIconBg, { backgroundColor: colors.emerald + '15' }]}>
                  <Feather name="check-circle" size={18} color={colors.emerald} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.completedTitle, { color: colors.emerald }]}>
                    {t('category.lastResult')}
                  </Text>
                  <Text style={[styles.completedResult, { color: colors.textSecondary }]}>
                    {category.lastResult.correctAnswers}/{category.lastResult.totalQuestions}
                  </Text>
                </View>
              </View>
            </Card>
          </AnimatedEntrance>
        )}

        {/* All done message */}
        {category.availableCount === 0 && (
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

      {/* Footer */}
      <AnimatedEntrance delay={300}>
        <View style={[styles.footer, { paddingHorizontal: spacing.screenPadding }]}>
          {category.availableCount > 0 ? (
            <Button
              label={category.lastResult ? t('category.playAgain') : t('category.start')}
              variant="primary"
              size="lg"
              onPress={handleStart}
              loading={starting}
              iconLeft={<Feather name="play" size={18} color="#FFFFFF" />}
            />
          ) : (
            <Button
              label={t('category.playAgain')}
              variant="primary"
              size="lg"
              onPress={handleReplay}
              loading={starting}
              iconLeft={<Feather name="rotate-ccw" size={18} color="#FFFFFF" />}
            />
          )}
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
    backgroundColor: 'transparent',
  },
  icon: {
    fontSize: 44,
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
    flex: 1,
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
