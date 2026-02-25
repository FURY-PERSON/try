import React, { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  runOnJS,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Screen } from '@/components/layout/Screen';
import { Button } from '@/components/ui/Button';
import { GameHeader } from '@/features/game/components/GameHeader';
import { SwipeCard } from '@/features/game/components/SwipeCard';
import { ExplanationCard } from '@/features/game/components/ExplanationCard';
import { Skeleton } from '@/components/feedback/Skeleton';
import { ErrorState } from '@/components/feedback/ErrorState';
import { useDailySet } from '@/features/game/hooks/useDailySet';
import { useCardGame } from '@/features/game/hooks/useCardGame';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useGameStore } from '@/features/game/stores/useGameStore';
import { useThemeContext } from '@/theme';
import { fontFamily } from '@/theme/typography';
import type { DailySetQuestion } from '@/shared';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DISMISS_THRESHOLD = SCREEN_WIDTH * 0.2;

export default function CardScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ mode?: string }>();
  // streak from store used only as initial value; liveStreak from hook tracks per-answer
  const language = useSettingsStore((s) => s.language);
  const collectionType = useGameStore((s) => s.collectionType);
  const storedCollectionQuestions = useGameStore((s) => s.collectionQuestions);
  const insets = useSafeAreaInsets();
  const { colors, gradients } = useThemeContext();
  const { t } = useTranslation();

  const isCollectionMode = params.mode === 'collection';

  const collectionQuestions: DailySetQuestion[] = useMemo(() => {
    if (!isCollectionMode || storedCollectionQuestions.length === 0) return [];
    return storedCollectionQuestions.map((q, i) => ({
      id: q.id,
      statement: q.statement ?? '',
      isTrue: q.isTrue ?? false,
      explanation: q.explanation ?? '',
      source: q.source ?? '',
      sourceUrl: q.sourceUrl ?? null,
      language: q.language ?? 'ru',
      categoryId: q.categoryId ?? '',
      difficulty: q.difficulty ?? 3,
      illustrationUrl: q.illustrationUrl ?? null,
      sortOrder: i + 1,
    }));
  }, [isCollectionMode, storedCollectionQuestions]);

  const { data: dailyData, isLoading, isError, error, refetch } = useDailySet();

  const questions = useMemo(() => {
    if (isCollectionMode) return collectionQuestions;
    if (!dailyData?.questions) return [];
    return [...dailyData.questions].sort((a, b) => a.sortOrder - b.sortOrder);
  }, [isCollectionMode, collectionQuestions, dailyData]);

  const dailySetId = isCollectionMode ? null : (dailyData?.id ?? null);

  const {
    currentQuestion,
    currentIndex,
    totalCards,
    feedback,
    isSubmitting,
    isComplete,
    progress,
    liveStreak,
    handleSwipe,
    handleNextCard,
  } = useCardGame(questions, dailySetId);

  // Swipe-to-dismiss for explanation card
  const dismissX = useSharedValue(0);
  const dismissOpacity = useSharedValue(1);

  // Reset dismiss animation when feedback changes
  useEffect(() => {
    dismissX.value = 0;
    dismissOpacity.value = 1;
  }, [feedback, dismissX, dismissOpacity]);

  const onDismiss = () => {
    handleNextCard();
  };

  const dismissGesture = Gesture.Pan()
    .onUpdate((e) => {
      dismissX.value = e.translationX;
    })
    .onEnd((e) => {
      if (Math.abs(e.translationX) > DISMISS_THRESHOLD) {
        const dir = e.translationX > 0 ? 1 : -1;
        dismissX.value = withTiming(dir * SCREEN_WIDTH * 1.5, { duration: 250 });
        dismissOpacity.value = withTiming(0, { duration: 250 });
        runOnJS(onDismiss)();
      } else {
        dismissX.value = withSpring(0);
      }
    });

  const dismissStyle = useAnimatedStyle(() => {
    const rotation = interpolate(
      dismissX.value,
      [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
      [-10, 0, 10],
      Extrapolation.CLAMP,
    );
    return {
      transform: [
        { translateX: dismissX.value },
        { rotate: `${rotation}deg` },
      ],
      opacity: dismissOpacity.value,
    };
  });

  useEffect(() => {
    if (isComplete && !feedback) {
      router.replace('/modal/results');
    }
  }, [isComplete, feedback, router]);

  // Next question for stack preview
  const nextQuestion = questions[currentIndex + 1] ?? null;
  const nextCategoryName = nextQuestion?.category
    ? (language === 'en' ? nextQuestion.category.nameEn : nextQuestion.category.name)
    : '';

  if (!isCollectionMode && isLoading) {
    return (
      <Screen style={{ paddingTop: insets.top }}>
        <Skeleton width="100%" height={48} shape="rectangle" />
        <Skeleton width="100%" height={300} shape="card" style={{ marginTop: 32 }} />
      </Screen>
    );
  }

  if (!isCollectionMode && isError) {
    return (
      <Screen style={{ paddingTop: insets.top }}>
        <ErrorState message={error?.message} onRetry={refetch} />
      </Screen>
    );
  }

  if (!currentQuestion && !feedback) {
    return (
      <Screen style={{ paddingTop: insets.top }}>
        <ErrorState message="No questions available" onRetry={refetch} />
      </Screen>
    );
  }

  const categoryName =
    currentQuestion?.category
      ? (language === 'en'
          ? currentQuestion.category.nameEn
          : currentQuestion.category.name)
      : '';

  return (
    <Screen padded={false} backgroundColor={gradients.card[0]}>
      <LinearGradient
        colors={gradients.card}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.gradient}
      >
        <View style={[styles.padded, { paddingTop: insets.top }]}>
          <GameHeader progress={progress} streak={liveStreak} />
        </View>

        {feedback ? (
          <>
            <View style={styles.explanationArea}>
              <GestureDetector gesture={dismissGesture}>
                <Animated.View style={[styles.padded, dismissStyle]}>
                  <ExplanationCard
                    statement={feedback.statement}
                    isTrue={feedback.isTrue}
                    userAnsweredCorrectly={feedback.userAnsweredCorrectly}
                    explanation={feedback.explanation}
                    source={feedback.source}
                    sourceUrl={feedback.sourceUrl}
                  />
                </Animated.View>
              </GestureDetector>
            </View>
            <View style={[styles.bottomButton, { paddingBottom: 16 + insets.bottom }]}>
              <Button
                label={`${t('common.next')} →`}
                variant={feedback.userAnsweredCorrectly ? 'success' : 'primary'}
                size="lg"
                onPress={handleNextCard}
              />
            </View>
          </>
        ) : currentQuestion ? (
          <>
            {/* Swipe hints at the top */}
            <View style={styles.swipeHints}>
              <View style={[styles.hintBadge, { backgroundColor: colors.red + '10', borderWidth: 1, borderColor: colors.red + '20' }]}>
                <Text style={[styles.hintText, { color: colors.red }]}>
                  ← {t('game.fake')}
                </Text>
              </View>
              <Text style={[styles.hintCenter, { color: colors.textTertiary }]}>
                {t('game.swipeHint')}
              </Text>
              <View style={[styles.hintBadge, { backgroundColor: colors.emerald + '10', borderWidth: 1, borderColor: colors.emerald + '20' }]}>
                <Text style={[styles.hintText, { color: colors.emerald }]}>
                  {t('game.fact')} →
                </Text>
              </View>
            </View>

            <View style={styles.cardArea}>
              <View style={styles.padded}>
                <SwipeCard
                  statement={currentQuestion.statement}
                  categoryName={categoryName}
                  cardIndex={currentIndex}
                  totalCards={totalCards}
                  onSwipe={handleSwipe}
                  disabled={isSubmitting}
                  nextStatement={nextQuestion?.statement}
                  nextCategoryName={nextCategoryName}
                />
              </View>
            </View>
          </>
        ) : null}
      </LinearGradient>
    </Screen>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  padded: {
    paddingHorizontal: 20,
  },
  cardArea: {
    flex: 1,
    justifyContent: 'center',
  },
  explanationArea: {
    flex: 1,
    justifyContent: 'center',
  },
  bottomButton: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  swipeHints: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
  },
  hintBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  hintText: {
    fontSize: 13,
    fontFamily: fontFamily.semiBold,
  },
  hintCenter: {
    fontSize: 12,
    fontFamily: fontFamily.regular,
  },
});
