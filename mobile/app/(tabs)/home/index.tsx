import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
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
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Screen } from '@/components/layout/Screen';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { AnimatedEntrance } from '@/components/ui/AnimatedEntrance';
import { Skeleton } from '@/components/feedback/Skeleton';
import { ErrorState } from '@/components/feedback/ErrorState';
import { AdBanner } from '@/components/ads/AdBanner';
import { AdFreeIcon } from '@/components/ads/AdFreeIcon';
import { DisableAdsModal } from '@/components/ads/DisableAdsModal';
import { IconFromName } from '@/components/ui/IconFromName';
import { StreakBadge } from '@/features/game/components/StreakBadge';
import { useFloatingTabBarHeight } from '@/components/navigation/FloatingTabBar';
import { useHomeFeed } from '@/features/home/hooks/useHomeFeed';
import { useGameStore } from '@/features/game/stores/useGameStore';
import { useDailySet } from '@/features/game/hooks/useDailySet';
import { useUserStore } from '@/stores/useUserStore';
import { useAdsStore } from '@/stores/useAdsStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useThemeContext } from '@/theme';
import { fontFamily } from '@/theme/typography';
import { analytics } from '@/services/analytics';
import { CARDS_PER_DAILY_SET } from '@/shared';
import type { CategoryWithCount, DifficultyProgress, HomeFeedCollection } from '@/shared';
import { getStreakBonusPercent } from '@/features/game/utils/streakBonus';
import { useFeatureFlag, useFeatureFlagPayload } from '@/features/feature-flags/hooks/useFeatureFlag';
import { ShieldBadge } from '@/features/shield/components/ShieldBadge';
import { ShieldInfoModal } from '@/features/shield/components/ShieldInfoModal';
import { useDailyLoginClaim } from '@/features/daily-login/hooks/useDailyLoginClaim';
import { s } from '@/utils/scale';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Static gradient point objects — avoids per-render allocation
const GRADIENT_START_00 = { x: 0, y: 0 } as const;
const GRADIENT_END_11 = { x: 1, y: 1 } as const;
const GRADIENT_END_01 = { x: 0, y: 1 } as const;
const GRADIENT_END_10 = { x: 1, y: 0 } as const;

export default function HomeScreen() {
  const { colors, spacing, gradients, elevation, borderRadius, scale } = useThemeContext();
  const { t } = useTranslation();
  const router = useRouter();
  useDailyLoginClaim();
  const language = useSettingsStore((s) => s.language);
  const startDailySet = useGameStore((s) => s.startDailySet);
  const startCollectionSession = useGameStore((s) => s.startCollectionSession);

  const insets = useSafeAreaInsets();
  const tabBarHeight = useFloatingTabBarHeight();
  const { data: feed, isLoading, isError, error, refetch: refetchFeed, isRefetching: isRefetchingFeed } = useHomeFeed();
  const { data: dailyData, refetch: refetchDaily, isRefetching: isRefetchingDaily } = useDailySet();

  const isRefetching = isRefetchingFeed || isRefetchingDaily;
  const refetch = useCallback(() => {
    refetchFeed();
    refetchDaily();
  }, [refetchFeed, refetchDaily]);
  const [loadingCollection, setLoadingCollection] = useState<string | null>(null);
  const [showDisableAds, setShowDisableAds] = useState(false);
  const [showShieldInfo, setShowShieldInfo] = useState(false);
  const [userScrolled, setUserScrolled] = useState(false);
  const showDisableAdsOnReturn = useAdsStore((s) => s.showDisableAdsOnReturn);

  // Show disable-ads modal when returning from game after interstitial
  useEffect(() => {
    if (showDisableAdsOnReturn && !useAdsStore.getState().isAdFree()) {
      setShowDisableAds(true);
      useAdsStore.getState().setShowDisableAdsOnReturn(false);
    }
  }, [showDisableAdsOnReturn]);

  const streak = feed?.userProgress?.streak ?? 0;
  const [shieldCount, setShieldCount] = useState(0);

  // Sync shield count from feed
  useEffect(() => {
    if (feed?.userProgress?.shields != null) {
      setShieldCount(feed.userProgress.shields);
    }
  }, [feed?.userProgress?.shields]);
  const streakBonusPayload = useFeatureFlagPayload<{ tiers: { minStreak: number; bonusPercent: number }[] }>('streak_bonus');
  const isStreakBonusEnabled = useFeatureFlag('streak_bonus');
  const bonusPercent = isStreakBonusEnabled ? getStreakBonusPercent(streak, streakBonusPayload?.tiers) : 0;
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

  const collections = useMemo(
    () => [...allCollections].sort((a, b) => Number(a.isCompleted ?? false) - Number(b.isCompleted ?? false)),
    [allCollections],
  );

  // Track scroll analytics only once per session to avoid excessive logging
  const categoriesScrolledRef = useRef(false);
  const collectionsScrolledRef = useRef(false);

  const handleCategoriesScroll = useCallback((_e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!categoriesScrolledRef.current) {
      categoriesScrolledRef.current = true;
      analytics.logEvent('home_section_scroll', { section: 'categories' });
    }
  }, []);

  const handleCollectionsScroll = useCallback((_e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!collectionsScrolledRef.current) {
      collectionsScrolledRef.current = true;
      analytics.logEvent('home_section_scroll', { section: 'collections' });
    }
  }, []);

  useEffect(() => {
    if (daily?.isLocked && daily.unlocksAt) {
      const diffMs = new Date(daily.unlocksAt).getTime() - Date.now();
      const daysUntilUnlock = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
      analytics.logEvent('daily_locked_viewed', { daysUntilUnlock });
    }
  }, [daily?.isLocked, daily?.unlocksAt]);

  const handleStartDaily = useCallback(async () => {
    if (dailyData && !daily?.isLocked) {
      startDailySet(dailyData.id ?? null, dailyData.questions?.length ?? CARDS_PER_DAILY_SET, streak);
      router.push('/game/card');
    }
  }, [dailyData, daily?.isLocked, startDailySet, router, streak]);

  const handleContinueDaily = useCallback(async () => {
    if (!dailyData || !dailyData.progress) return;
    const totalCards = dailyData.questions?.length ?? CARDS_PER_DAILY_SET;
    const previousResults = dailyData.progress.results.map((r) => ({
      questionId: r.questionId,
      correct: r.correct,
      score: 0,
      timeSpentMs: 0,
    }));
    startDailySet(dailyData.id ?? null, totalCards, streak, dailyData.progress!.currentIndex, previousResults);
    router.push('/game/card');
  }, [dailyData, startDailySet, router, streak]);

  const handleOpenCategory = useCallback((categoryId: string) => {
    router.push({ pathname: '/category/[id]', params: { id: categoryId } });
  }, [router]);

  const handleStartDifficulty = useCallback((difficulty: 'easy' | 'medium' | 'hard') => {
    router.push({ pathname: '/difficulty/[level]', params: { level: difficulty } });
  }, [router]);

  const handleStartRandom = useCallback(() => {
    router.push('/random');
  }, [router]);


  const handleOpenCollection = useCallback((collectionId: string) => {
    router.push({ pathname: '/collection/[id]', params: { id: collectionId } });
  }, [router]);

  const lockoutText = useMemo(() => {
    if (!daily?.unlocksAt) return '';
    const unlocksAt = new Date(daily.unlocksAt);
    const now = new Date();
    const diffMs = unlocksAt.getTime() - now.getTime();
    if (diffMs <= 0) return '';
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays > 0) return t('home.locked', { days: diffDays });
    return t('home.lockedHours', { hours: diffHours });
  }, [daily?.unlocksAt, t]);

  const difficultyCards = useMemo<Array<{
    key: 'easy' | 'medium' | 'hard';
    gradient: [string, string];
    icon: string;
  }>>(() => [
    { key: 'easy', gradient: gradients.success, icon: '🟢' },
    { key: 'medium', gradient: gradients.warm, icon: '🟡' },
    { key: 'hard', gradient: gradients.danger, icon: '🔴' },
  ], [gradients.success, gradients.warm, gradients.danger]);

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

  return (
    <Screen padded={false}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} progressViewOffset={128} />
        }
        contentContainerStyle={{ paddingBottom: tabBarHeight + 16 }}
        onTouchStart={() => setUserScrolled(true)}
      >
        {/* Header */}
        <AnimatedEntrance delay={0} style={{ zIndex: 10 }}>
          <View style={[styles.header, { paddingHorizontal: spacing.screenPadding, paddingTop: insets.top }]}>
            <Text style={[styles.largeTitle, { color: colors.textPrimary }]}>
              {t('home.title')}
            </Text>
            <View style={styles.headerRight}>
              <View style={{ marginRight: s(4) }}>
                <ShieldBadge count={shieldCount} onPress={() => setShowShieldInfo(true)} />
              </View>
              <AdFreeIcon onPress={() => setShowDisableAds(true)} hideHint={userScrolled} />
              <StreakBadge days={streak} showIncrement={false} bonusPercent={bonusPercent} />
            </View>
          </View>
        </AnimatedEntrance>

        {/* Section 1: Hero Daily Set */}
        <AnimatedEntrance delay={100}>
          <LinearGradient
            colors={gradients.card}
            start={GRADIENT_START_00}
            end={GRADIENT_END_11}
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
                    {t('home.completed')} {daily.lastResult.correctAnswers}/{daily.lastResult.totalQuestions}
                  </Text>
                )}
                <Text style={[styles.lockText, { color: colors.textTertiary }]}>
                  {lockoutText}
                </Text>
              </>
            ) : dailyData?.progress ? (
              <>
                <Text style={[styles.heroDesc, { color: colors.textSecondary }]}>
                  {t('home.dailyContinueDesc', {
                    answered: dailyData.progress.currentIndex,
                    total: dailyData.questions?.length ?? CARDS_PER_DAILY_SET,
                  })}
                </Text>
                <Button
                  label={t('common.continue')}
                  variant="primary"
                  size="lg"
                  onPress={handleContinueDaily}
                  iconLeft={<Feather name="play" size={18} color="#FFFFFF" />}
                />
              </>
            ) : daily?.set ? (
              <>
                <Text style={[styles.heroDesc, { color: colors.textSecondary }]}>
                  {t('home.dailyDesc', { count: dailyData?.questions?.length ?? CARDS_PER_DAILY_SET })}
                </Text>
                <View style={styles.shieldBonusRow}>
                  <MaterialCommunityIcons name="shield-outline" size={s(16)} color="#3B82F6" />
                  <Text style={[styles.shieldBonusText, { color: '#3B82F6' }]}>
                    {t('shield.dailyBonus')}
                  </Text>
                </View>
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
            <Feather name="play-circle" size={24} color={colors.primary} />
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
                    scaleSize={scale}
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
              <View style={{ height: scale(160) }}>
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
                      scaleSize={scale}
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
            <AdBanner placement="home" size="MEDIUM_RECTANGLE" />
          </View>
      </ScrollView>


      <ShieldInfoModal
        visible={showShieldInfo}
        onClose={() => setShowShieldInfo(false)}
        shieldCount={shieldCount}
        onShieldsEarned={setShieldCount}
      />
      <DisableAdsModal visible={showDisableAds} onClose={() => setShowDisableAds(false)} />
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
  scaleSize,
  onPress,
}: {
  category: CategoryWithCount;
  language: string;
  colors: Record<string, string>;
  borderRadius: Record<string, number>;
  elevation: Record<string, Record<string, unknown>>;
  scaleSize: (v: number) => number;
  onPress: () => void;
}) {
  const name = language === 'en' ? (category.nameEn || category.name) : category.name;
  const { t } = useTranslation();
  const anim = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: anim.value }],
  }));

  const cardSize = scaleSize(140);

  return (
    <AnimatedPressable
      onPressIn={() => { anim.value = withTiming(0.95, { duration: 120 }); }}
      onPressOut={() => { anim.value = withTiming(1, { duration: 120 }); }}
      onPress={onPress}
      style={animStyle}
    >
      <View
        style={[
          styles.categoryCard,
          {
            width: cardSize,
            height: cardSize,
            backgroundColor: colors.surface,
            borderColor: colors.border,
            borderRadius: br.xl,
            ...elev.sm,
          },
        ]}
      >
        <View style={[styles.categoryAccent, { backgroundColor: category.color ?? colors.primary }]} />
        <IconFromName name={category.icon} size={scaleSize(32)} color={category.color ?? colors.primary} />
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
      onPressIn={() => { scale.value = withTiming(0.95, { duration: 120 }); }}
      onPressOut={() => { scale.value = withTiming(1, { duration: 120 }); }}
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
            start={GRADIENT_START_00}
            end={GRADIENT_END_11}
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
  scaleSize,
  onPress,
}: {
  collection: HomeFeedCollection;
  language: string;
  colors: Record<string, string>;
  borderRadius: Record<string, number>;
  elevation: Record<string, Record<string, unknown>>;
  loading: boolean;
  scaleSize: (v: number) => number;
  onPress: () => void;
}) {
  const title = language === 'en' ? (collection.titleEn || collection.title) : collection.title;
  const desc = language === 'en' ? (collection.descriptionEn || collection.description) : collection.description;
  const { t } = useTranslation();
  const anim = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: anim.value }],
  }));

  return (
    <AnimatedPressable
      onPressIn={() => { anim.value = withTiming(0.95, { duration: 120 }); }}
      onPressOut={() => { anim.value = withTiming(1, { duration: 120 }); }}
      onPress={onPress}
      disabled={loading}
      style={animStyle}
    >
      <View
        style={[
          styles.collectionCard,
          {
            width: scaleSize(180),
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: br.xl,
            ...elev.sm,
          },
        ]}
      >
        <IconFromName name={collection.icon} size={scaleSize(32)} color={colors.primary} />
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
    minHeight: s(44),
    zIndex: 10,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(4),
  },
  largeTitle: {
    fontSize: s(24),
    fontFamily: fontFamily.bold,
    letterSpacing: -0.3,
  },
  skeletons: {
    marginTop: s(24),
  },
  // Hero Daily Card
  heroCard: {
    padding: s(24),
  },
  heroOverline: {
    fontSize: s(11),
    fontFamily: fontFamily.bold,
    letterSpacing: 1.5,
    marginBottom: s(8),
  },
  heroTitle: {
    fontSize: s(24),
    fontFamily: fontFamily.bold,
    lineHeight: s(30),
    letterSpacing: -0.2,
    marginBottom: s(8),
  },
  heroDesc: {
    fontSize: s(15),
    fontFamily: fontFamily.regular,
    lineHeight: s(20),
    marginBottom: s(16),
  },
  shieldBonusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(4),
    marginBottom: s(12),
  },
  shieldBonusText: {
    fontSize: s(13),
    fontFamily: fontFamily.semiBold,
  },
  lockText: {
    fontSize: s(15),
    fontFamily: fontFamily.semiBold,
    lineHeight: s(20),
    marginTop: s(4),
  },
  // Random facts button
  randomButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: s(16),
    gap: s(12),
  },
  randomEmoji: {
    fontSize: s(28),
  },
  randomTitle: {
    fontSize: s(16),
    fontFamily: fontFamily.bold,
  },
  randomDesc: {
    fontSize: s(13),
    fontFamily: fontFamily.regular,
    marginTop: s(2),
  },
  // Section headers
  sectionOverline: {
    fontSize: s(11),
    fontFamily: fontFamily.bold,
    letterSpacing: 1.5,
    marginBottom: s(8),
  },
  categoriesContainer: {
    height: s(160),
  },
  // Category cards
  categoryCard: {
    padding: s(16),
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
    height: s(36),
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryName: {
    fontSize: s(14),
    fontFamily: fontFamily.semiBold,
    textAlign: 'center',
  },
  categoryCount: {
    fontSize: s(11),
    fontFamily: fontFamily.regular,
    textAlign: 'center',
  },
  // Difficulty cards
  difficultyRow: {
    flexDirection: 'row',
    gap: s(12),
    marginTop: s(8),
  },
  difficultyCard: {
    padding: s(16),
    alignItems: 'center',
    gap: s(6),
    flex: 1,
  },
  difficultyGradientDot: {
    width: s(36),
    height: s(36),
    borderRadius: s(18),
    overflow: 'hidden',
    marginBottom: s(4),
  },
  difficultyDotInner: {
    flex: 1,
  },
  difficultyTitle: {
    fontSize: s(15),
    fontFamily: fontFamily.bold,
  },
  difficultyDesc: {
    fontSize: s(11),
    fontFamily: fontFamily.regular,
    textAlign: 'center',
  },
  difficultyProgress: {
    fontSize: s(11),
    fontFamily: fontFamily.medium,
    textAlign: 'center',
  },
  // Collection cards
  collectionCard: {
    padding: s(16),
    gap: s(6),
  },
  collectionIconWrap: {
    height: s(36),
    justifyContent: 'center',
  },
  collectionTitle: {
    fontSize: s(15),
    fontFamily: fontFamily.bold,
    lineHeight: s(20),
    height: s(40),
  },
  collectionDesc: {
    fontSize: s(13),
    fontFamily: fontFamily.regular,
    lineHeight: s(18),
    height: s(36),
  },
  collectionCount: {
    fontSize: s(11),
    fontFamily: fontFamily.regular,
  },

});
