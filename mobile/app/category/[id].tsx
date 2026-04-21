import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
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
import { categoriesApi } from '@/features/home/api/categoriesApi';
import { collectionsApi } from '@/features/collections/api/collectionsApi';
import { useGameStore } from '@/features/game/stores/useGameStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useThemeContext } from '@/theme';
import { fontFamily } from '@/theme/typography';
import { analytics } from '@/services/analytics';
import { showToast } from '@/stores/useToastStore';
import { s } from '@/utils/scale';

// Static gradient point objects — avoids per-render allocation
const GRADIENT_START = { x: 0, y: 0 } as const;
const GRADIENT_END_V = { x: 0, y: 1 } as const;

export default function CategoryDetailScreen() {
  const insets = useSafeAreaInsets();
  const { colors, gradients, spacing, borderRadius, elevation, isDark } = useThemeContext();
  const { t } = useTranslation();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const language = useSettingsStore((s) => s.language);
  const queryClient = useQueryClient();
  const startCollectionSession = useGameStore((s) => s.startCollectionSession);
  const [starting, setStarting] = useState(false);

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
        count: 20,
        ...(replay ? { replay: true } : {}),
      });
      const cachedFeed = queryClient.getQueryData<HomeFeed>(['home', 'feed']);
      const streak = cachedFeed?.userProgress?.streak ?? 0;
      startCollectionSession(session.sessionId, 'category', session.questions.length, session.questions, streak);
      analytics.logEvent('category_start', {
        type: 'category',
        referenceId: id,
        questionCount: session.questions.length,
        replay,
      });
      router.push({ pathname: '/game/card', params: { mode: 'collection' } });
    } catch (err) {
      queryClient.invalidateQueries({ queryKey: ['category', id] });
      showToast(err instanceof Error ? err.message : t('error.generic'));
    } finally {
      setStarting(false);
    }
  }, [id, starting, startCollectionSession, router]);

  const handleStart = useCallback(() => {
    doStart(false);
  }, [doStart]);

  const handleReplay = useCallback(() => {
    doStart(true);
  }, [doStart]);

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
          start={GRADIENT_START}
          end={GRADIENT_END_V}
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

      {/* Ad Banner above buttons */}
      <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: spacing.screenPadding, marginBottom: 8 }}>
        <AdBanner placement="category" size="adaptive" />
      </View>

      {/* Footer */}
      <AnimatedEntrance delay={300}>
        <View style={[styles.footer, { paddingHorizontal: spacing.screenPadding, paddingBottom: Platform.OS === 'android' ? 32 + insets.bottom : 32 }]}>
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

    </Screen>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: s(16),
  },
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
    backgroundColor: 'transparent',
  },
  icon: {
    fontSize: s(44),
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
  content: {
    gap: s(16),
  },
  infoCard: {
    paddingVertical: s(18),
    paddingHorizontal: s(20),
    gap: s(10),
  },
  progressLabel: {
    fontSize: s(14),
    fontFamily: fontFamily.semiBold,
  },
  progressBarBg: {
    height: s(8),
    borderRadius: s(4),
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: s(4),
  },
  infoIconBg: {
    width: s(32),
    height: s(32),
    borderRadius: s(10),
    alignItems: 'center',
    justifyContent: 'center',
  },
  completedCard: {
    paddingVertical: s(14),
    paddingHorizontal: s(16),
  },
  completedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(12),
  },
  completedTitle: {
    fontSize: s(15),
    fontFamily: fontFamily.bold,
  },
  completedResult: {
    fontSize: s(13),
    fontFamily: fontFamily.regular,
    marginTop: s(2),
  },
  errorText: {
    fontSize: s(16),
    fontFamily: fontFamily.medium,
  },
  footer: {
    paddingBottom: s(32),
    gap: s(12),
  },
});
