import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  ScrollView,
  RefreshControl,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  ActivityIndicator,
  Alert,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Screen } from '@/components/layout/Screen';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { AnimatedEntrance } from '@/components/ui/AnimatedEntrance';
import { Skeleton } from '@/components/feedback/Skeleton';
import { ErrorState } from '@/components/feedback/ErrorState';
import { AdBanner } from '@/components/ads/AdBanner';
import { IconFromName } from '@/components/ui/IconFromName';
import { StreakBadge } from '@/features/game/components/StreakBadge';
import { useHomeFeed } from '@/features/home/hooks/useHomeFeed';
import { useGameStore } from '@/features/game/stores/useGameStore';
import { useDailySet } from '@/features/game/hooks/useDailySet';
import { useUserStore } from '@/stores/useUserStore';
import { collectionsApi } from '@/features/collections/api/collectionsApi';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useThemeContext } from '@/theme';
import { fontFamily } from '@/theme/typography';
import { analytics } from '@/services/analytics';
import { CARDS_PER_DAILY_SET } from '@/shared';
import type { CategoryWithCount, DifficultyProgress, HomeFeedCollection } from '@/shared';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function HomeScreen() {
  const { colors, spacing, gradients, elevation, borderRadius } = useThemeContext();
  const { t } = useTranslation();
  const router = useRouter();
  const language = useSettingsStore((s) => s.language);
  const startDailySet = useGameStore((s) => s.startDailySet);
  const startCollectionSession = useGameStore((s) => s.startCollectionSession);

  const insets = useSafeAreaInsets();
  const { data: feed, isLoading, isError, error, refetch, isRefetching } = useHomeFeed();
  const { data: dailyData } = useDailySet();
  const [loadingCollection, setLoadingCollection] = useState<string | null>(null);
  const [loadingRandom, setLoadingRandom] = useState(false);

  const streak = feed?.userProgress?.streak ?? 0;
  const daily = feed?.daily;
  const allCategories = feed?.categories ?? [];
  const allCollections = feed?.collections ?? [];
  const difficultyProgress = feed?.difficultyProgress;

  // Sync nickname & avatarEmoji from server to local store
  useEffect(() => {
    if (feed?.userProgress) {
      const { nickname, avatarEmoji } = feed.userProgress;
      const store = useUserStore.getState();
      if (nickname && !store.nickname) {
        store.setNickname(nickname);
      }
      if (avatarEmoji && !store.avatarEmoji) {
        store.setAvatarEmoji(avatarEmoji);
      }
    }
  }, [feed?.userProgress]);

  const collections = allCollections;

  const handleCategoriesScroll = useCallback((_e: NativeSyntheticEvent<NativeScrollEvent>) => {
    analytics.logEvent('home_section_scroll', { section: 'categories' });
  }, []);

  const handleCollectionsScroll = useCallback((_e: NativeSyntheticEvent<NativeScrollEvent>) => {
    analytics.logEvent('home_section_scroll', { section: 'collections' });
  }, []);

  useEffect(() => {
    if (daily?.isLocked && daily.unlocksAt) {
      const diffMs = new Date(daily.unlocksAt).getTime() - Date.now();
      const daysUntilUnlock = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
      analytics.logEvent('daily_locked_viewed', { daysUntilUnlock });
    }
  }, [daily?.isLocked, daily?.unlocksAt]);

  const handleStartDaily = useCallback(() => {
    if (dailyData && !daily?.isLocked) {
      startDailySet(dailyData.id ?? null, dailyData.questions?.length ?? CARDS_PER_DAILY_SET);
      router.push('/game/card');
    }
  }, [dailyData, daily?.isLocked, startDailySet, router]);

  const handleOpenCategory = useCallback((categoryId: string) => {
    router.push({ pathname: '/category/[id]', params: { id: categoryId } });
  }, [router]);

  const handleStartDifficulty = useCallback(async (difficulty: 'easy' | 'medium' | 'hard') => {
    const progress = difficultyProgress?.[difficulty];
    const isCompleted = progress && progress.totalCount > 0 && progress.answeredCount >= progress.totalCount;

    if (isCompleted) {
      Alert.alert(
        t('category.allDone'),
        t('category.replayDesc'),
        [
          { text: t('common.cancel'), style: 'cancel' },
          {
            text: t('category.playAgain'),
            onPress: async () => {
              setLoadingCollection(difficulty);
              try {
                const session = await collectionsApi.start({
                  type: 'difficulty',
                  difficulty,
                  replay: true,
                });
                startCollectionSession(session.sessionId, 'difficulty', session.questions.length, session.questions, true);
                analytics.logEvent('collection_start', { type: 'difficulty', referenceId: difficulty, questionCount: session.questions.length, replay: true });
                router.push({
                  pathname: '/game/card',
                  params: { mode: 'collection' },
                });
              } catch (err) {
                const message = err instanceof Error ? err.message : 'Error';
                Alert.alert(t('common.error'), message);
              } finally {
                setLoadingCollection(null);
              }
            },
          },
        ],
      );
      return;
    }

    setLoadingCollection(difficulty);
    try {
      const session = await collectionsApi.start({
        type: 'difficulty',
        difficulty,
        count: 50,
      });
      startCollectionSession(session.sessionId, 'difficulty', session.questions.length, session.questions);
      analytics.logEvent('collection_start', { type: 'difficulty', referenceId: difficulty, questionCount: session.questions.length });
      router.push({
        pathname: '/game/card',
        params: { mode: 'collection' },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error';
      Alert.alert(t('common.error'), message);
    } finally {
      setLoadingCollection(null);
    }
  }, [startCollectionSession, router, difficultyProgress]);

  const handleStartRandom = useCallback(async () => {
    setLoadingRandom(true);
    try {
      const session = await collectionsApi.start({
        type: 'random',
        count: 100,
      });
      startCollectionSession(session.sessionId, 'category', session.questions.length, session.questions);
      analytics.logEvent('collection_start', { type: 'random', questionCount: session.questions.length });
      router.push({
        pathname: '/game/card',
        params: { mode: 'collection' },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error';
      Alert.alert(t('common.error'), message);
    } finally {
      setLoadingRandom(false);
    }
  }, [startCollectionSession, router]);

  const handleOpenCollection = useCallback((collectionId: string) => {
    router.push({ pathname: '/collection/[id]', params: { id: collectionId } });
  }, [router]);

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
        <View style={[styles.header, { paddingTop: insets.top }]}>
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
    gradient: [string, string];
    icon: string;
  }> = [
    { key: 'easy', gradient: gradients.success, icon: '🟢' },
    { key: 'medium', gradient: gradients.warm, icon: '🟡' },
    { key: 'hard', gradient: gradients.danger, icon: '🔴' },
  ];

  return (
    <Screen padded={false}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} progressViewOffset={128} />
        }
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Header */}
        <AnimatedEntrance delay={0}>
          <View style={[styles.header, { paddingHorizontal: spacing.screenPadding, paddingTop: insets.top }]}>
            <Text style={[styles.largeTitle, { color: colors.textPrimary }]}>
              {t('home.title')}
            </Text>
            <StreakBadge days={streak} />
          </View>
        </AnimatedEntrance>

        {/* Section 1: Hero Daily Set */}
        <AnimatedEntrance delay={100}>
          <LinearGradient
            colors={gradients.card}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
              styles.heroCard,
              {
                borderRadius: borderRadius.xxl,
                borderWidth: 1,
                borderColor: colors.primary + '20',
                ...elevation.xl,
                marginTop: spacing.xl,
                marginHorizontal: spacing.screenPadding,
              },
            ]}
          >
            <Text style={[styles.heroOverline, { color: colors.primary }]}>
              {t('home.dailySet').toUpperCase()}
            </Text>
            <Text style={[styles.heroTitle, { color: colors.textPrimary }]}>
              {daily?.set?.theme
                ? language === 'en'
                  ? (daily.set.themeEn || daily.set.theme)
                  : daily.set.theme
                : t('home.dailySet')}
            </Text>

            {daily?.isLocked ? (
              <>
                {daily.lastResult && (
                  <Text style={[styles.heroDesc, { color: colors.emerald }]}>
                    {t('home.completed')} {daily.lastResult.correctAnswers}/{CARDS_PER_DAILY_SET}
                  </Text>
                )}
                <Text style={[styles.lockText, { color: colors.textTertiary }]}>
                  {getLockoutText()}
                </Text>
              </>
            ) : daily?.set ? (
              <>
                <Text style={[styles.heroDesc, { color: colors.textSecondary }]}>
                  {t('home.dailyDesc')}
                </Text>
                <Button
                  label={t('common.play')}
                  variant="primary"
                  size="lg"
                  onPress={handleStartDaily}
                  iconLeft={<Feather name="play" size={18} color="#FFFFFF" />}
                />
              </>
            ) : (
              <Text style={[styles.heroDesc, { color: colors.textSecondary }]}>
                {t('home.empty')}
              </Text>
            )}
          </LinearGradient>
        </AnimatedEntrance>

        {/* Random Facts Button */}
        <AnimatedEntrance delay={150}>
          <Pressable
            onPress={handleStartRandom}
            disabled={loadingRandom}
            style={[
              styles.randomButton,
              {
                marginTop: spacing.sectionGap,
                marginHorizontal: spacing.screenPadding,
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: borderRadius.xl,
                ...elevation.sm,
              },
            ]}
          >
            <Text style={styles.randomEmoji}>🎲</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.randomTitle, { color: colors.textPrimary }]}>
                {t('home.randomFacts')}
              </Text>
              <Text style={[styles.randomDesc, { color: colors.textSecondary }]}>
                {t('home.randomDesc')}
              </Text>
            </View>
            {loadingRandom ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Feather name="play-circle" size={24} color={colors.primary} />
            )}
          </Pressable>
        </AnimatedEntrance>

        {/* Section 2: Featured Collections */}
        {collections.length > 0 && (
          <AnimatedEntrance delay={200}>
            <View style={{ marginTop: spacing.sectionGap }}>
              <Text style={[styles.sectionOverline, { color: colors.primary, paddingHorizontal: spacing.screenPadding }]}>
                {t('home.featured').toUpperCase()}
              </Text>
              <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={collections}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{ gap: 12, paddingVertical: 8, paddingHorizontal: spacing.screenPadding }}
                onScrollBeginDrag={handleCollectionsScroll}
                removeClippedSubviews={true}
                maxToRenderPerBatch={5}
                initialNumToRender={5}
                windowSize={5}
                renderItem={({ item }) => (
                  <CollectionCard
                    collection={item}
                    language={language}
                    colors={colors}
                    borderRadius={borderRadius}
                    elevation={elevation}
                    loading={loadingCollection === item.id}
                    onPress={() => handleOpenCollection(item.id)}
                  />
                )}
              />
            </View>
          </AnimatedEntrance>
        )}

        {/* Section 3: Categories */}
        {allCategories.length > 0 && (
          <AnimatedEntrance delay={300}>
            <View style={{ marginTop: spacing.sectionGap }}>
              <Text style={[styles.sectionOverline, { color: colors.primary, paddingHorizontal: spacing.screenPadding }]}>
                {t('home.categories').toUpperCase()}
              </Text>
              <View style={styles.categoriesContainer}>
                <FlatList
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  data={allCategories}
                  keyExtractor={(item) => item.id}
                  contentContainerStyle={{ gap: 12, paddingVertical: 8, paddingHorizontal: spacing.screenPadding }}
                  onScrollBeginDrag={handleCategoriesScroll}
                  removeClippedSubviews={true}
                  maxToRenderPerBatch={5}
                  initialNumToRender={5}
                  windowSize={5}
                  renderItem={({ item }) => (
                    <CategoryCard
                      category={item}
                      language={language}
                      colors={colors}
                      borderRadius={borderRadius}
                      elevation={elevation}
                      onPress={() => handleOpenCategory(item.id)}
                    />
                  )}
                />
              </View>
            </View>
          </AnimatedEntrance>
        )}

        {/* Section 4: Difficulty */}
        <AnimatedEntrance delay={400}>
          <View style={{ marginTop: spacing.sectionGap, paddingHorizontal: spacing.screenPadding }}>
            <Text style={[styles.sectionOverline, { color: colors.primary }]}>
              {t('home.difficulty').toUpperCase()}
            </Text>
            <View style={styles.difficultyRow}>
              {difficultyCards.map(({ key, gradient, icon }) => (
                <DifficultyCard
                  key={key}
                  diffKey={key}
                  gradient={gradient}
                  icon={icon}
                  colors={colors}
                  borderRadius={borderRadius}
                  elevation={elevation}
                  loading={loadingCollection === key}
                  onPress={() => handleStartDifficulty(key)}
                  t={t}
                  progress={difficultyProgress?.[key]}
                />
              ))}
            </View>
          </View>
        </AnimatedEntrance>

        <View style={{ marginTop: spacing.sectionGap, paddingHorizontal: spacing.screenPadding }}>
          <AdBanner placement="home_bottom" />
        </View>
      </ScrollView>
    </Screen>
  );
}

// --- Sub-components ---

const CategoryCard = React.memo(function CategoryCard({
  category,
  language,
  colors,
  borderRadius: br,
  elevation: elev,
  onPress,
}: {
  category: CategoryWithCount;
  language: string;
  colors: Record<string, string>;
  borderRadius: Record<string, number>;
  elevation: Record<string, Record<string, unknown>>;
  onPress: () => void;
}) {
  const name = language === 'en' ? (category.nameEn || category.name) : category.name;
  const { t } = useTranslation();
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      onPressIn={() => { scale.value = withSpring(0.95, { damping: 15, stiffness: 300 }); }}
      onPressOut={() => { scale.value = withSpring(1, { damping: 15, stiffness: 300 }); }}
      onPress={onPress}
      style={animStyle}
    >
      <View
        style={[
          styles.categoryCard,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            borderRadius: br.xl,
            ...elev.sm,
          },
        ]}
      >
        <View style={[styles.categoryAccent, { backgroundColor: category.color ?? colors.primary }]} />
        <IconFromName name={category.icon} size={32} color={category.color ?? colors.primary} />
        <Text style={[styles.categoryName, { color: colors.textPrimary }]} numberOfLines={2}>
          {name}
        </Text>
        <Text style={[styles.categoryCount, { color: category.isCompleted ? colors.emerald : colors.textSecondary }]}>
          {category.isCompleted
            ? t('home.allCompleted')
            : `${category.answeredCount}/${category.totalCount}`}
        </Text>
      </View>
    </AnimatedPressable>
  );
});

const DifficultyCard = React.memo(function DifficultyCard({
  diffKey,
  gradient,
  icon,
  colors,
  borderRadius: br,
  elevation: elev,
  loading,
  onPress,
  t,
  progress,
}: {
  diffKey: 'easy' | 'medium' | 'hard';
  gradient: [string, string];
  icon: string;
  colors: Record<string, string>;
  borderRadius: Record<string, number>;
  elevation: Record<string, Record<string, unknown>>;
  loading: boolean;
  onPress: () => void;
  t: (key: string) => string;
  progress?: { totalCount: number; answeredCount: number };
}) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      onPressIn={() => { scale.value = withSpring(0.95, { damping: 15, stiffness: 300 }); }}
      onPressOut={() => { scale.value = withSpring(1, { damping: 15, stiffness: 300 }); }}
      onPress={onPress}
      disabled={loading}
      style={[{ flex: 1 }, animStyle]}
    >
      <View
        style={[
          styles.difficultyCard,
          {
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: br.xl,
            ...elev.sm,
          },
        ]}
      >
        <View style={[styles.difficultyGradientDot]}>
          <LinearGradient
            colors={gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.difficultyDotInner}
          />
        </View>
        <Text style={[styles.difficultyTitle, { color: colors.textPrimary }]}>
          {t(`home.${diffKey}`)}
        </Text>
        <Text style={[styles.difficultyDesc, { color: colors.textSecondary }]}>
          {t(`home.${diffKey}Desc`)}
        </Text>
        {progress && progress.totalCount > 0 && (
          <Text style={[styles.difficultyProgress, { color: colors.textTertiary }]}>
            {progress.answeredCount}/{progress.totalCount}
          </Text>
        )}
        {loading && (
          <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: 4 }} />
        )}
      </View>
    </AnimatedPressable>
  );
});

const CollectionCard = React.memo(function CollectionCard({
  collection,
  language,
  colors,
  borderRadius: br,
  elevation: elev,
  loading,
  onPress,
}: {
  collection: HomeFeedCollection;
  language: string;
  colors: Record<string, string>;
  borderRadius: Record<string, number>;
  elevation: Record<string, Record<string, unknown>>;
  loading: boolean;
  onPress: () => void;
}) {
  const title = language === 'en' ? (collection.titleEn || collection.title) : collection.title;
  const desc = language === 'en' ? (collection.descriptionEn || collection.description) : collection.description;
  const { t } = useTranslation();
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      onPressIn={() => { scale.value = withSpring(0.95, { damping: 15, stiffness: 300 }); }}
      onPressOut={() => { scale.value = withSpring(1, { damping: 15, stiffness: 300 }); }}
      onPress={onPress}
      disabled={loading}
      style={animStyle}
    >
      <View
        style={[
          styles.collectionCard,
          {
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: br.xl,
            ...elev.sm,
          },
        ]}
      >
        <IconFromName name={collection.icon} size={32} color={colors.primary} />
        <Text style={[styles.collectionTitle, { color: colors.textPrimary }]} numberOfLines={2}>
          {title}
        </Text>
        {desc ? (
          <Text style={[styles.collectionDesc, { color: colors.textSecondary }]} numberOfLines={2}>
            {desc}
          </Text>
        ) : null}
        <Text style={[styles.collectionCount, { color: collection.isCompleted ? colors.emerald : colors.textTertiary }]}>
          {collection.isCompleted
            ? t('home.allCompleted')
            : collection.answeredCount != null
              ? `${collection.answeredCount}/${collection._count.questions}`
              : t('home.questionsCount', { count: collection._count.questions })}
        </Text>
        {loading && <ActivityIndicator size="small" color={colors.primary} />}
      </View>
    </AnimatedPressable>
  );
});

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 44,
  },
  largeTitle: {
    fontSize: 32,
    fontFamily: fontFamily.bold,
    letterSpacing: -0.5,
  },
  skeletons: {
    marginTop: 24,
  },
  // Hero Daily Card
  heroCard: {
    padding: 24,
  },
  heroOverline: {
    fontSize: 11,
    fontFamily: fontFamily.bold,
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  heroTitle: {
    fontSize: 24,
    fontFamily: fontFamily.bold,
    lineHeight: 30,
    letterSpacing: -0.2,
    marginBottom: 8,
  },
  heroDesc: {
    fontSize: 15,
    fontFamily: fontFamily.regular,
    lineHeight: 20,
    marginBottom: 16,
  },
  lockText: {
    fontSize: 15,
    fontFamily: fontFamily.semiBold,
    lineHeight: 20,
    marginTop: 4,
  },
  // Random facts button
  randomButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  randomEmoji: {
    fontSize: 28,
  },
  randomTitle: {
    fontSize: 16,
    fontFamily: fontFamily.bold,
  },
  randomDesc: {
    fontSize: 13,
    fontFamily: fontFamily.regular,
    marginTop: 2,
  },
  // Section headers
  sectionOverline: {
    fontSize: 11,
    fontFamily: fontFamily.bold,
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  categoriesContainer: {
    height: 160,
  },
  // Category cards
  categoryCard: {
    width: 140,
    height: 140,
    padding: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  categoryAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
  },
  categoryIconWrap: {
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryName: {
    fontSize: 14,
    fontFamily: fontFamily.semiBold,
    textAlign: 'center',
  },
  categoryCount: {
    fontSize: 11,
    fontFamily: fontFamily.regular,
    textAlign: 'center',
  },
  // Difficulty cards
  difficultyRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  difficultyCard: {
    padding: 16,
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  difficultyGradientDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 4,
  },
  difficultyDotInner: {
    flex: 1,
  },
  difficultyTitle: {
    fontSize: 15,
    fontFamily: fontFamily.bold,
  },
  difficultyDesc: {
    fontSize: 11,
    fontFamily: fontFamily.regular,
    textAlign: 'center',
  },
  difficultyProgress: {
    fontSize: 11,
    fontFamily: fontFamily.medium,
    textAlign: 'center',
  },
  // Collection cards
  collectionCard: {
    width: 180,
    padding: 16,
    gap: 6,
  },
  collectionIconWrap: {
    height: 36,
    justifyContent: 'center',
  },
  collectionTitle: {
    fontSize: 15,
    fontFamily: fontFamily.bold,
    lineHeight: 20,
    height: 40,
  },
  collectionDesc: {
    fontSize: 13,
    fontFamily: fontFamily.regular,
    lineHeight: 18,
    height: 36,
  },
  collectionCount: {
    fontSize: 11,
    fontFamily: fontFamily.regular,
  },
});
