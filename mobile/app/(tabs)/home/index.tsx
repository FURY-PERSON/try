import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  ScrollView,
  RefreshControl,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  ActivityIndicator,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Feather } from '@expo/vector-icons';
import { Screen } from '@/components/layout/Screen';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { Skeleton } from '@/components/feedback/Skeleton';
import { ErrorState } from '@/components/feedback/ErrorState';
import { AdBanner } from '@/components/ads/AdBanner';
import { StreakBadge } from '@/features/game/components/StreakBadge';
import { useHomeFeed } from '@/features/home/hooks/useHomeFeed';
import { useGameStore } from '@/features/game/stores/useGameStore';
import { useDailySet } from '@/features/game/hooks/useDailySet';
import { collectionsApi } from '@/features/collections/api/collectionsApi';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useThemeContext } from '@/theme';
import { analytics } from '@/services/analytics';
import { CARDS_PER_DAILY_SET } from '@/shared';
import type { CategoryWithCount, CollectionSummary } from '@/shared';

export default function HomeScreen() {
  const { colors, spacing } = useThemeContext();
  const { t } = useTranslation();
  const router = useRouter();
  const language = useSettingsStore((s) => s.language);
  const startDailySet = useGameStore((s) => s.startDailySet);
  const startCollectionSession = useGameStore((s) => s.startCollectionSession);

  const { data: feed, isLoading, isError, error, refetch, isRefetching } = useHomeFeed();
  const { data: dailyData } = useDailySet();
  const [loadingCollection, setLoadingCollection] = useState<string | null>(null);
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string | null>(null);

  const streak = feed?.userProgress?.streak ?? 0;
  const daily = feed?.daily;
  const allCategories = feed?.categories ?? [];
  const allCollections = feed?.collections ?? [];

  // Filter by selected category
  const categories = useMemo(() => {
    if (!selectedCategorySlug) return allCategories;
    return allCategories.filter((c) => c.slug === selectedCategorySlug);
  }, [allCategories, selectedCategorySlug]);

  const collections = useMemo(() => {
    // Collections don't have a direct category, so we show all when filtered
    // This matches FR-104 AC-3: sections filter "соответственно"
    return allCollections;
  }, [allCollections]);

  const handleFilterSelect = useCallback((slug: string | null) => {
    setSelectedCategorySlug(slug);
    if (slug) {
      analytics.logEvent('home_filter_applied', { categorySlug: slug });
    }
  }, []);

  const handleSectionScroll = useCallback((section: string) => {
    return (_e: NativeSyntheticEvent<NativeScrollEvent>) => {
      analytics.logEvent('home_section_scroll', { section });
    };
  }, []);

  useEffect(() => {
    if (daily?.isLocked && daily.unlocksAt) {
      const diffMs = new Date(daily.unlocksAt).getTime() - Date.now();
      const daysUntilUnlock = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
      analytics.logEvent('daily_locked_viewed', { daysUntilUnlock });
    }
  }, [daily?.isLocked, daily?.unlocksAt]);

  const handleStartDaily = () => {
    if (dailyData && !daily?.isLocked) {
      startDailySet(dailyData.id ?? null, dailyData.questions?.length ?? CARDS_PER_DAILY_SET);
      router.push('/game/card');
    }
  };

  const handleStartCategory = useCallback(async (categoryId: string) => {
    setLoadingCollection(categoryId);
    try {
      const session = await collectionsApi.start({
        type: 'category',
        categoryId,
        count: 10,
      });
      startCollectionSession(session.sessionId, 'category', session.questions.length);
      analytics.logEvent('collection_start', { type: 'category', referenceId: categoryId, questionCount: session.questions.length });
      router.push({
        pathname: '/game/card',
        params: { questions: JSON.stringify(session.questions), mode: 'collection' },
      });
    } catch {
      // Silently fail — user can retry
    } finally {
      setLoadingCollection(null);
    }
  }, [startCollectionSession, router]);

  const handleStartDifficulty = useCallback(async (difficulty: 'easy' | 'medium' | 'hard') => {
    setLoadingCollection(difficulty);
    try {
      const session = await collectionsApi.start({
        type: 'difficulty',
        difficulty,
        count: 10,
      });
      startCollectionSession(session.sessionId, 'difficulty', session.questions.length);
      analytics.logEvent('collection_start', { type: 'difficulty', referenceId: difficulty, questionCount: session.questions.length });
      router.push({
        pathname: '/game/card',
        params: { questions: JSON.stringify(session.questions), mode: 'collection' },
      });
    } catch {
      // Silently fail
    } finally {
      setLoadingCollection(null);
    }
  }, [startCollectionSession, router]);

  const handleOpenCollection = useCallback((collectionId: string) => {
    router.push({ pathname: '/collection/[id]', params: { id: collectionId } });
  }, [router]);

  // Lockout timer text
  const getLockoutText = () => {
    if (!daily?.unlocksAt) return '';
    const unlocksAt = new Date(daily.unlocksAt);
    const now = new Date();
    const diffMs = unlocksAt.getTime() - now.getTime();
    if (diffMs <= 0) return '';
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays > 0) return t('home.locked', { days: diffDays });
    return t('home.lockedHours', { hours: diffHours });
  };

  if (isLoading) {
    return (
      <Screen>
        <View style={styles.header}>
          <Text style={[styles.largeTitle, { color: colors.textPrimary }]}>{t('home.title')}</Text>
          <StreakBadge days={0} />
        </View>
        <View style={styles.skeletons}>
          <Skeleton width="100%" height={180} shape="card" />
          <Skeleton width="100%" height={100} shape="card" style={{ marginTop: 24 }} />
          <Skeleton width="100%" height={100} shape="card" style={{ marginTop: 24 }} />
        </View>
      </Screen>
    );
  }

  if (isError) {
    return (
      <Screen>
        <ErrorState message={error?.message} onRetry={refetch} />
      </Screen>
    );
  }

  const difficultyCards: Array<{
    key: 'easy' | 'medium' | 'hard';
    color: string;
    icon: string;
  }> = [
    { key: 'easy', color: colors.primary, icon: '🟢' },
    { key: 'medium', color: colors.orange, icon: '🟡' },
    { key: 'hard', color: colors.red, icon: '🔴' },
  ];

  return (
    <Screen>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.largeTitle, { color: colors.textPrimary }]}>
            {t('home.title')}
          </Text>
          <StreakBadge days={streak} />
        </View>

        {/* Filter Chips */}
        {allCategories.length > 0 && (
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={allCategories}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.filterChips}
            ListHeaderComponent={
              <Chip
                label={t('home.categoriesAll')}
                selected={selectedCategorySlug === null}
                onPress={() => handleFilterSelect(null)}
              />
            }
            renderItem={({ item }) => (
              <Chip
                label={language === 'en' ? item.nameEn : item.name}
                selected={selectedCategorySlug === item.slug}
                onPress={() =>
                  handleFilterSelect(
                    selectedCategorySlug === item.slug ? null : item.slug,
                  )
                }
              />
            )}
          />
        )}

        {/* Section 1: Daily Set */}
        <Card variant="highlighted" style={{ marginTop: spacing.xl }}>
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
            {t('home.dailySet')}
          </Text>
          {daily?.set?.theme && (
            <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
              {t('home.dailyTheme', {
                theme: language === 'en' ? daily.set.themeEn : daily.set.theme,
              })}
            </Text>
          )}

          {daily?.isLocked ? (
            <>
              {daily.lastResult && (
                <Text style={[styles.cardDesc, { color: colors.primary }]}>
                  {t('home.completed')} {daily.lastResult.correctAnswers}/{CARDS_PER_DAILY_SET}
                </Text>
              )}
              <Text style={[styles.lockText, { color: colors.textTertiary }]}>
                {getLockoutText()}
              </Text>
            </>
          ) : daily?.set ? (
            <>
              <Text style={[styles.cardDesc, { color: colors.textSecondary }]}>
                {t('home.dailyDesc')}
              </Text>
              <Button
                label={t('common.play')}
                variant="primary"
                size="lg"
                onPress={handleStartDaily}
                iconLeft={<Text style={{ fontSize: 16 }}>▶</Text>}
              />
            </>
          ) : (
            <Text style={[styles.cardDesc, { color: colors.textSecondary }]}>
              {t('home.empty')}
            </Text>
          )}
        </Card>

        {/* Section 2: Categories */}
        {categories.length > 0 && (
          <View style={{ marginTop: spacing.sectionGap }}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              {t('home.categories')}
            </Text>
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={categories}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ gap: 12, paddingVertical: 8 }}
              onScrollBeginDrag={handleSectionScroll('categories')}
              renderItem={({ item }) => (
                <CategoryCard
                  category={item}
                  language={language}
                  colors={colors}
                  loading={loadingCollection === item.id}
                  onPress={() => handleStartCategory(item.id)}
                />
              )}
            />
          </View>
        )}

        {/* Section 3: Difficulty */}
        <View style={{ marginTop: spacing.sectionGap }}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            {t('home.difficulty')}
          </Text>
          <View style={styles.difficultyRow}>
            {difficultyCards.map(({ key, color, icon }) => (
              <Pressable
                key={key}
                style={[styles.difficultyCard, { backgroundColor: colors.surface }]}
                onPress={() => handleStartDifficulty(key)}
                disabled={loadingCollection === key}
              >
                <Text style={styles.difficultyIcon}>{icon}</Text>
                <Text style={[styles.difficultyTitle, { color: colors.textPrimary }]}>
                  {t(`home.${key}`)}
                </Text>
                <Text style={[styles.difficultyDesc, { color: colors.textSecondary }]}>
                  {t(`home.${key}Desc`)}
                </Text>
                {loadingCollection === key && (
                  <ActivityIndicator size="small" color={color} style={{ marginTop: 4 }} />
                )}
              </Pressable>
            ))}
          </View>
        </View>

        {/* Section 4: Featured Collections */}
        {collections.length > 0 && (
          <View style={{ marginTop: spacing.sectionGap }}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              {t('home.featured')}
            </Text>
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={collections}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ gap: 12, paddingVertical: 8 }}
              onScrollBeginDrag={handleSectionScroll('collections')}
              renderItem={({ item }) => (
                <CollectionCard
                  collection={item}
                  language={language}
                  colors={colors}
                  loading={loadingCollection === item.id}
                  onPress={() => handleOpenCollection(item.id)}
                />
              )}
            />
          </View>
        )}

        <View style={{ marginTop: spacing.sectionGap }}>
          <AdBanner placement="home_bottom" />
        </View>
      </ScrollView>
    </Screen>
  );
}

// --- Sub-components ---

function CategoryCard({
  category,
  language,
  colors,
  loading,
  onPress,
}: {
  category: CategoryWithCount;
  language: string;
  colors: Record<string, string>;
  loading: boolean;
  onPress: () => void;
}) {
  const name = language === 'en' ? category.nameEn : category.name;
  const { t } = useTranslation();

  return (
    <Pressable
      onPress={onPress}
      disabled={loading || category.availableCount === 0}
      style={[
        styles.categoryCard,
        { backgroundColor: colors.surface, borderColor: category.color + '30' },
      ]}
    >
      <Text style={styles.categoryIcon}>{category.icon}</Text>
      <Text style={[styles.categoryName, { color: colors.textPrimary }]} numberOfLines={1}>
        {name}
      </Text>
      <Text style={[styles.categoryCount, { color: colors.textSecondary }]}>
        {category.availableCount > 0
          ? t('home.questionsAvailable', { count: category.availableCount })
          : t('home.allDone')}
      </Text>
      {loading && <ActivityIndicator size="small" color={category.color} />}
    </Pressable>
  );
}

function CollectionCard({
  collection,
  language,
  colors,
  loading,
  onPress,
}: {
  collection: CollectionSummary;
  language: string;
  colors: Record<string, string>;
  loading: boolean;
  onPress: () => void;
}) {
  const title = language === 'en' ? collection.titleEn : collection.title;
  const desc = language === 'en' ? collection.descriptionEn : collection.description;
  const { t } = useTranslation();

  return (
    <Pressable
      onPress={onPress}
      disabled={loading}
      style={[styles.collectionCard, { backgroundColor: colors.surface }]}
    >
      <Text style={styles.collectionIcon}>{collection.icon}</Text>
      <Text style={[styles.collectionTitle, { color: colors.textPrimary }]} numberOfLines={2}>
        {title}
      </Text>
      {desc ? (
        <Text style={[styles.collectionDesc, { color: colors.textSecondary }]} numberOfLines={2}>
          {desc}
        </Text>
      ) : null}
      <Text style={[styles.collectionCount, { color: colors.textTertiary }]}>
        {t('home.questionsCount', { count: collection._count.questions })}
      </Text>
      {loading && <ActivityIndicator size="small" color={colors.primary} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 44,
  },
  filterChips: {
    gap: 8,
    paddingVertical: 12,
  },
  largeTitle: {
    fontSize: 34,
    fontFamily: 'Nunito_700Bold',
    letterSpacing: 0.37,
  },
  skeletons: {
    marginTop: 24,
  },
  cardTitle: {
    fontSize: 20,
    fontFamily: 'Nunito_700Bold',
    lineHeight: 25,
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 15,
    fontFamily: 'Nunito_600SemiBold',
    lineHeight: 20,
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 15,
    fontFamily: 'Nunito_400Regular',
    lineHeight: 20,
    marginBottom: 16,
  },
  lockText: {
    fontSize: 15,
    fontFamily: 'Nunito_600SemiBold',
    lineHeight: 20,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 22,
    fontFamily: 'Nunito_700Bold',
    lineHeight: 28,
    marginBottom: 4,
  },
  // Category cards
  categoryCard: {
    width: 120,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    gap: 6,
  },
  categoryIcon: {
    fontSize: 28,
  },
  categoryName: {
    fontSize: 14,
    fontFamily: 'Nunito_600SemiBold',
    textAlign: 'center',
  },
  categoryCount: {
    fontSize: 12,
    fontFamily: 'Nunito_400Regular',
    textAlign: 'center',
  },
  // Difficulty cards
  difficultyRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  difficultyCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    gap: 4,
  },
  difficultyIcon: {
    fontSize: 24,
  },
  difficultyTitle: {
    fontSize: 15,
    fontFamily: 'Nunito_700Bold',
  },
  difficultyDesc: {
    fontSize: 12,
    fontFamily: 'Nunito_400Regular',
    textAlign: 'center',
  },
  // Collection cards
  collectionCard: {
    width: 160,
    padding: 16,
    borderRadius: 16,
    gap: 6,
  },
  collectionIcon: {
    fontSize: 32,
  },
  collectionTitle: {
    fontSize: 15,
    fontFamily: 'Nunito_700Bold',
    lineHeight: 20,
  },
  collectionDesc: {
    fontSize: 13,
    fontFamily: 'Nunito_400Regular',
    lineHeight: 18,
  },
  collectionCount: {
    fontSize: 12,
    fontFamily: 'Nunito_400Regular',
  },
});
