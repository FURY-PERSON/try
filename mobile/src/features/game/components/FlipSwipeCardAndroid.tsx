/**
 * Android card component — fly-out / fly-in animation.
 *
 * Instead of flipping the card (scaleX), the front card (statement) flies
 * off-screen and a separate back card (explanation) flies in from the
 * same side. The user can then swipe the explanation card in any direction
 * to dismiss it and advance to the next card.
 *
 * Key Android perf optimizations:
 * - No LinearGradient on animated card faces
 * - collapsable={false} on animated views (no needsOffscreenAlphaCompositing — no animated opacity)
 * - programmaticSwipe batched via runOnUI (single worklet, not 4 JSI calls)
 * - Swipe fly-out duration scaled by remaining distance
 * - Gesture memoized with useMemo
 * - Stable callback refs
 * - All inline styles memoized
 * - Back face always mounted + pre-rendered with question data
 */
import React, { useEffect, useMemo, useState, useImperativeHandle, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Linking,
  Pressable,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,

  runOnJS,
  runOnUI,
  interpolate,
  interpolateColor,
  Extrapolation,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useThemeContext } from '@/theme';
import { fontFamily } from '@/theme/typography';
import type { SwipeDirection } from '../types';
import type { FlipSwipeCardRef, FlipSwipeCardProps } from './FlipSwipeCard';
import { s } from '@/utils/scale';

type CardPhase = 'front' | 'transitioning' | 'back';

const SNAP_DURATION = 180;
const FLY_OUT_DURATION = 250;
const BUTTON_FLY_OUT_DURATION = 480;
const FLY_IN_DURATION = 300;
const GRADIENT_START = { x: 0, y: 0 } as const;
const GRADIENT_END_H = { x: 1, y: 0 } as const;

// Memoized back face body — only re-renders when feedback content actually changes
const BackFaceBody = React.memo<{
  statement?: string;
  explanation?: string;
  source?: string;
  sourceUrl?: string;
  truthColor: string;
  truthLabel: string;
  colors: { textSecondary: string; textPrimary: string; textTertiary: string };
  t: (key: string) => string;
}>(({ statement, explanation, source, sourceUrl, truthColor, truthLabel, colors, t }) => {
  const handleSourcePress = () => {
    if (sourceUrl) Linking.openURL(sourceUrl);
  };

  return (
    <>
      <Text style={[styles.backStatement, { color: colors.textSecondary }]} numberOfLines={3}>
        &laquo;{statement ?? ''}&raquo;
      </Text>
      <View style={[styles.truthBadge, { backgroundColor: truthColor + '15' }]}>
        <Text style={[styles.truthText, { color: truthColor }]}>
          {t('game.thisIs')} {truthLabel}
        </Text>
      </View>
      <Text style={[styles.explanation, { color: colors.textPrimary }]}>
        {explanation ?? ''}
      </Text>
      {source ? (
        <Pressable onPress={handleSourcePress} style={styles.sourceRow}>
          <Feather name="link" size={12} color={colors.textTertiary} />
          <Text
            style={[styles.sourceText, { color: colors.textTertiary }, sourceUrl ? styles.sourceLink : undefined]}
          >
            {source}
          </Text>
        </Pressable>
      ) : null}
    </>
  );
});

export const FlipSwipeCardAndroid = React.forwardRef<FlipSwipeCardRef, FlipSwipeCardProps>(({
  statement,
  categoryName,
  cardIndex,
  totalCards,
  feedback,
  onSwipe,
  onDismiss,
  isSubmitting = false,
  nextStatement,
  nextCategoryName,
  explanation: preExplanation,
  source: preSource,
  sourceUrl: preSourceUrl,
  isTrue: preIsTrue,
}, ref) => {
  const { colors, borderRadius, gradients } = useThemeContext();
  const { t } = useTranslation();
  const { width: screenWidth } = useWindowDimensions();

  const swipeThreshold = useMemo(() => screenWidth * 0.25, [screenWidth]);
  const dismissThreshold = useMemo(() => screenWidth * 0.20 / 1.1, [screenWidth]);
  const cardWidth = useMemo(() => screenWidth - 48, [screenWidth]);
  const halfScreen = screenWidth / 2;
  const flyDistance = screenWidth * 1.5;

  // --- Shared values ---
  const frontTranslateX = useSharedValue(0);
  const backTranslateX = useSharedValue(flyDistance);
  const translateY = useSharedValue(0);
  const phase = useSharedValue<CardPhase>('front');
  const answerDirection = useSharedValue(1); // 1 = right, -1 = left
  const entranceProgress = useSharedValue(1);
  const isSubmittingShared = useSharedValue(false);
  const isProgrammatic = useSharedValue(false);
  const isCorrectShared = useSharedValue(false);

  useEffect(() => {
    isSubmittingShared.value = isSubmitting;
  }, [isSubmitting, isSubmittingShared]);

  const [stackContent, setStackContent] = useState({ nextStatement, nextCategoryName });
  const [fourthCardReady, setFourthCardReady] = useState(true);

  // Stable refs for callbacks
  const onSwipeRef = useRef(onSwipe);
  onSwipeRef.current = onSwipe;
  const onDismissRef = useRef(onDismiss);
  onDismissRef.current = onDismiss;

  const activeFeedback = useMemo(
    () => (feedback?.statement === statement ? feedback : null),
    [feedback, statement],
  );

  // Keep last feedback in a ref so back face content persists during dismiss
  const lastFeedbackRef = useRef(activeFeedback);
  if (activeFeedback) {
    lastFeedbackRef.current = activeFeedback;
  }
  const backFeedback = activeFeedback ?? lastFeedbackRef.current;

  // Reset on card change
  useEffect(() => {
    frontTranslateX.value = 0;
    backTranslateX.value = flyDistance;
    translateY.value = 0;
    phase.value = 'front';
    isProgrammatic.value = false;
    isCorrectShared.value = false;
    answerDirection.value = 1;
    entranceProgress.value = 0;
    entranceProgress.value = withTiming(1, { duration: 300, easing: Easing.out(Easing.cubic) });
    lastFeedbackRef.current = null;
    setFourthCardReady(false);
    const raf = requestAnimationFrame(() => {
      setStackContent({ nextStatement, nextCategoryName });
    });
    const timer = setTimeout(() => setFourthCardReady(true), 300);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
    };
  }, [cardIndex]);

  // When feedback arrives — only update correctness.
  // The back card fly-in is triggered by the front fly-out completion callback
  // (sequential: front fully exits → then back enters).
  useEffect(() => {
    if (activeFeedback) {
      isCorrectShared.value = activeFeedback.userAnsweredCorrectly;

      // Fallback: feedback arrived without a swipe (e.g. external state change)
      if (phase.value === 'front') {
        const dir = answerDirection.value;
        phase.value = 'transitioning';
        frontTranslateX.value = withTiming(dir * flyDistance, {
          duration: FLY_OUT_DURATION,
          easing: Easing.out(Easing.cubic),
        }, (finished) => {
          if (finished) {
            backTranslateX.value = dir * flyDistance;
            backTranslateX.value = withTiming(0, {
              duration: FLY_IN_DURATION,
              easing: Easing.out(Easing.cubic),
            }, (fin) => {
              if (fin) phase.value = 'back';
            });
          }
        });
      }
      // If phase is 'transitioning', the front fly-out completion callback
      // handles starting the back fly-in. No action needed here.
    }
  }, [activeFeedback]);

  // Stable callbacks via refs
  const callOnSwipe = useCallback((direction: SwipeDirection) => {
    // Defer by 1 frame so the fly-out animation starts on the UI thread
    // before the JS thread gets busy with handleSwipe state updates
    // (setIsSubmitting, setFeedback, setPendingResult, setLiveStreak)
    requestAnimationFrame(() => onSwipeRef.current(direction));
  }, []);

  const callOnDismiss = useCallback(() => {
    onDismissRef.current();
  }, []);

  const programmaticSwipe = useCallback((direction: SwipeDirection) => {
    if (isSubmittingShared.value) return;
    const dir = direction === 'right' ? 1 : -1;

    // Set correctness immediately so the back card border color is ready
    // without waiting for the React re-render cycle.
    const userAnswer = direction === 'right';
    isCorrectShared.value = userAnswer === !!preIsTrue;

    // Batch all shared value updates in a single UI-thread worklet execution.
    runOnUI(() => {
      'worklet';
      isProgrammatic.value = true;
      answerDirection.value = dir;
      phase.value = 'transitioning';
      frontTranslateX.value = withTiming(dir * flyDistance, {
        duration: BUTTON_FLY_OUT_DURATION,
        easing: Easing.out(Easing.cubic),
      }, (finished) => {
        if (finished) {
          backTranslateX.value = dir * flyDistance;
          backTranslateX.value = withTiming(0, {
            duration: FLY_IN_DURATION,
            easing: Easing.out(Easing.cubic),
          }, (fin) => {
            if (fin) phase.value = 'back';
          });
        }
      });
    })();

    // Defer handleSwipe by 150ms so its heavy React re-render (5 setState calls)
    // lands when the card is already ~40% off-screen — stutter becomes invisible.
    // rAF (16ms) was too early — re-render hit frames 2-3 when card barely moved.
    setTimeout(() => onSwipeRef.current(direction), 150);
  }, [flyDistance, isSubmittingShared, isProgrammatic, isCorrectShared, preIsTrue, answerDirection, phase, frontTranslateX, backTranslateX]);

  const programmaticDismiss = useCallback(() => {
    backTranslateX.value = withTiming(
      flyDistance,
      { duration: 200, easing: Easing.out(Easing.cubic) },
      (finished) => { if (finished) runOnJS(callOnDismiss)(); },
    );
  }, [flyDistance, callOnDismiss, backTranslateX]);

  useImperativeHandle(ref, () => ({
    programmaticSwipe,
    programmaticDismiss,
  }), [programmaticSwipe, programmaticDismiss]);

  const SWIPE_SPEED_MULTIPLIER = 1.5;

  const gesture = useMemo(() => Gesture.Pan()
    .activeOffsetX([-15, 15])
    .onUpdate((event) => {
      if (phase.value === 'transitioning') return;
      if (phase.value === 'front' && isSubmittingShared.value) return;

      if (phase.value === 'front') {
        frontTranslateX.value = event.translationX * SWIPE_SPEED_MULTIPLIER;
      } else if (phase.value === 'back') {
        backTranslateX.value = event.translationX * SWIPE_SPEED_MULTIPLIER;
      }
      translateY.value = event.translationY * 0.3;
    })
    .onEnd((event) => {
      if (phase.value === 'transitioning') return;
      if (phase.value === 'front' && isSubmittingShared.value) return;

      const amplifiedX = event.translationX * SWIPE_SPEED_MULTIPLIER;
      const snap = { duration: SNAP_DURATION, easing: Easing.out(Easing.cubic) };

      if (phase.value === 'front') {
        if (Math.abs(amplifiedX) > swipeThreshold) {
          const dir = amplifiedX > 0 ? 1 : -1;
          answerDirection.value = dir;
          phase.value = 'transitioning';
          // Scale duration by remaining distance — card already partially swiped,
          // so full duration would make it appear to decelerate at the transition.
          const remainingRatio = 1 - Math.abs(amplifiedX) / flyDistance;
          const adjustedDuration = Math.max(100, Math.round(FLY_OUT_DURATION * remainingRatio));
          // Front flies out; back flies in only after front fully exits
          frontTranslateX.value = withTiming(dir * flyDistance, {
            duration: adjustedDuration,
            easing: Easing.out(Easing.cubic),
          }, (finished) => {
            if (finished) {
              backTranslateX.value = dir * flyDistance;
              backTranslateX.value = withTiming(0, {
                duration: FLY_IN_DURATION,
                easing: Easing.out(Easing.cubic),
              }, (fin) => {
                if (fin) phase.value = 'back';
              });
            }
          });
          translateY.value = withTiming(0, snap);
          runOnJS(callOnSwipe)(dir === 1 ? 'right' : 'left');
        } else {
          frontTranslateX.value = withTiming(0, snap);
          translateY.value = withTiming(0, snap);
        }
      } else if (phase.value === 'back') {
        if (Math.abs(amplifiedX) > dismissThreshold) {
          const flyDir = amplifiedX > 0 ? 1 : -1;
          backTranslateX.value = withTiming(
            flyDir * flyDistance,
            { duration: 200, easing: Easing.out(Easing.cubic) },
            (finished) => { if (finished) runOnJS(callOnDismiss)(); },
          );
          translateY.value = withTiming(0, { duration: 200 });
        } else {
          backTranslateX.value = withTiming(0, snap);
          translateY.value = withTiming(0, snap);
        }
      }
    }), [swipeThreshold, dismissThreshold, flyDistance, callOnSwipe, callOnDismiss]);

  // --- Animated styles ---

  // Front card: entrance + drag/fly-out transform
  const frontCardStyle = useAnimatedStyle(() => {
    'worklet';
    const ep = entranceProgress.value;
    const rotation = interpolate(
      frontTranslateX.value,
      [-halfScreen, 0, halfScreen],
      [-15, 0, 15],
      Extrapolation.CLAMP,
    );
    return {
      transform: [
        { scale: 0.96 + ep * 0.04 },
        { translateY: 12 - ep * 12 },
        { translateX: frontTranslateX.value },
        { translateY: translateY.value },
        { rotateZ: `${rotation}deg` },
      ],
    };
  });

  // Back card: fly-in/drag/fly-out transform
  const backCardStyle = useAnimatedStyle(() => {
    'worklet';
    const rotation = interpolate(
      backTranslateX.value,
      [-halfScreen, 0, halfScreen],
      [-15, 0, 15],
      Extrapolation.CLAMP,
    );
    return {
      transform: [
        { translateX: backTranslateX.value },
        { translateY: phase.value === 'back' ? translateY.value : 0 },
        { rotateZ: `${rotation}deg` },
      ],
    };
  });

  // Front border: gray → green/red during swipe
  const borderColorDefault = colors.border;
  const frontBorderStyle = useAnimatedStyle(() => {
    'worklet';
    if (isSubmittingShared.value && phase.value === 'front') {
      return { borderColor: 'rgba(99, 102, 241, 0.3)', borderWidth: 2 };
    }
    if (isProgrammatic.value || phase.value !== 'front') {
      return { borderColor: borderColorDefault, borderWidth: 2 };
    }
    const progress = interpolate(
      frontTranslateX.value,
      [-swipeThreshold, 0, swipeThreshold],
      [-1, 0, 1],
      Extrapolation.CLAMP,
    );
    const borderColor = interpolateColor(
      progress,
      [-1, 0, 1],
      ['rgba(239, 68, 68, 0.5)', borderColorDefault, 'rgba(16, 185, 68, 0.5)'],
    );
    return { borderColor, borderWidth: 2 };
  });

  // Back border: result color (green = correct, red = incorrect)
  const backBorderStyle = useAnimatedStyle(() => {
    'worklet';
    const borderColor = isCorrectShared.value
      ? 'rgba(16, 185, 68, 0.45)'
      : 'rgba(239, 68, 68, 0.45)';
    return { borderColor, borderWidth: 2 };
  });

  // FACT overlay opacity (front only)
  const factOverlayStyle = useAnimatedStyle(() => {
    'worklet';
    if (phase.value !== 'front' || isProgrammatic.value) return { opacity: 0 };
    return {
      opacity: interpolate(
        frontTranslateX.value, [0, swipeThreshold], [0, 1], Extrapolation.CLAMP,
      ),
    };
  });

  // FAKE overlay opacity (front only)
  const fakeOverlayStyle = useAnimatedStyle(() => {
    'worklet';
    if (phase.value !== 'front' || isProgrammatic.value) return { opacity: 0 };
    return {
      opacity: interpolate(
        frontTranslateX.value, [-swipeThreshold, 0], [1, 0], Extrapolation.CLAMP,
      ),
    };
  });

  // Stack styles (unchanged)
  const secondStackStyle = useAnimatedStyle(() => {
    'worklet';
    const ep = entranceProgress.value;
    return {
      transform: [{ scale: 0.92 + ep * 0.04 }],
      top: 24 - ep * 12,
      opacity: 1,
    };
  });

  const thirdStackStyle = useAnimatedStyle(() => {
    'worklet';
    const ep = entranceProgress.value;
    return {
      transform: [{ scale: 0.88 + ep * 0.04 }],
      top: 36 - ep * 12,
      opacity: 0.5,
    };
  });

  const fourthStackStyle = useAnimatedStyle(() => {
    'worklet';
    const ep = entranceProgress.value;
    return {
      transform: [{ scale: 0.84 + ep * 0.04 }],
      top: 48 - ep * 12,
      opacity: 0,
    };
  });

  const remainingCards = totalCards - cardIndex;

  // Back face derived values — use pre-render props for content that's known
  // before the user answers, feedback only for correct/incorrect result banner
  const isCorrectBack = backFeedback?.userAnsweredCorrectly;
  const resultBgColor = isCorrectBack ? gradients.success[0] : gradients.danger[0];
  const resultIcon = isCorrectBack ? 'check-circle' : 'close-circle';
  const resultText = isCorrectBack ? t('game.correct') : t('game.incorrect');
  // Truth/explanation data is known from the question — pre-render immediately
  const resolvedIsTrue = backFeedback?.isTrue ?? preIsTrue;
  const truthLabel = resolvedIsTrue ? t('game.fact') : t('game.fake');
  const truthColor = resolvedIsTrue ? colors.emerald : colors.red;

  // Memoized inline styles
  const dynamicStyles = useMemo(() => ({
    stackCard: { width: cardWidth },
    card: { width: cardWidth },
    stackCardBase: { backgroundColor: colors.surface, borderRadius: borderRadius.xxl, borderWidth: 2, borderColor: colors.border } as const,
    stackCardWithOverflow: { backgroundColor: colors.surface, borderRadius: borderRadius.xxl, borderWidth: 2, borderColor: colors.border, overflow: 'hidden' as const } as const,
    faceInnerBase: { backgroundColor: colors.surface, borderRadius: borderRadius.xxl } as const,
    topAccentRadius: { borderTopLeftRadius: borderRadius.xxl, borderTopRightRadius: borderRadius.xxl } as const,
    factOverlayBase: { backgroundColor: colors.emerald, borderRadius: borderRadius.sm } as const,
    fakeOverlayBase: { backgroundColor: colors.red, borderRadius: borderRadius.sm } as const,
    categoryBadgeBg: { backgroundColor: colors.primary + '12' } as const,
    categoryColor: { color: colors.primary } as const,
    quoteColor: { color: colors.primary } as const,
    statementColor: { color: colors.textPrimary } as const,
    topAccentColor: { backgroundColor: gradients.primary[0] } as const,
  }), [cardWidth, colors, borderRadius, gradients]);

  const backFaceColors = useMemo(() => ({
    textSecondary: colors.textSecondary,
    textPrimary: colors.textPrimary,
    textTertiary: colors.textTertiary,
  }), [colors.textSecondary, colors.textPrimary, colors.textTertiary]);

  return (
    <View style={styles.wrapper}>
      {/* Fourth card in stack */}
      {remainingCards > 3 && fourthCardReady && (
        <Animated.View
          collapsable={false}
          style={[
            styles.stackCard, dynamicStyles.stackCard,
            dynamicStyles.stackCardBase,
            fourthStackStyle,
          ]}
        />
      )}

      {/* Third card in stack */}
      {remainingCards > 2 && (
        <Animated.View
          collapsable={false}
          style={[
            styles.stackCard, dynamicStyles.stackCard,
            dynamicStyles.stackCardBase,
            thirdStackStyle,
          ]}
        />
      )}

      {/* Second card in stack */}
      {remainingCards > 1 && (
        <Animated.View
          collapsable={false}
          style={[
            styles.stackCard, dynamicStyles.stackCard,
            dynamicStyles.stackCardWithOverflow,
            secondStackStyle,
          ]}
        >
          <LinearGradient
            colors={gradients.primary}
            start={GRADIENT_START}
            end={GRADIENT_END_H}
            style={[styles.topAccent, dynamicStyles.topAccentRadius]}
          />
          {stackContent.nextStatement ? (
            <View style={styles.frontContent}>
              {stackContent.nextCategoryName ? (
                <View style={[styles.categoryBadge, dynamicStyles.categoryBadgeBg]}>
                  <Text style={[styles.category, dynamicStyles.categoryColor]}>
                    {stackContent.nextCategoryName}
                  </Text>
                </View>
              ) : null}
              <Text style={[styles.statementQuote, dynamicStyles.quoteColor]}>&laquo;</Text>
              <Text
                style={[styles.frontStatement, dynamicStyles.statementColor]}
                numberOfLines={8}
              >
                {stackContent.nextStatement}
              </Text>
              <Text style={[styles.statementQuote, styles.quoteEnd, dynamicStyles.quoteColor]}>&raquo;</Text>
            </View>
          ) : null}
        </Animated.View>
      )}

      {/* Main interactive area — container stays in place for gesture detection */}
      <GestureDetector gesture={gesture}>
        <Animated.View
          collapsable={false}
          style={[styles.cardContainer, dynamicStyles.card]}
        >
          {/* FRONT CARD (statement) */}
          <Animated.View
            collapsable={false}
            style={[styles.frontCard, frontCardStyle]}
          >
            <Animated.View
              style={[styles.faceInner, dynamicStyles.faceInnerBase, frontBorderStyle]}
            >
              <View style={[styles.topAccent, dynamicStyles.topAccentRadius, dynamicStyles.topAccentColor]} />

              <Animated.View
                style={[styles.overlay, styles.factOverlay, dynamicStyles.factOverlayBase, factOverlayStyle]}
              >
                <Text style={styles.overlayText}>{t('game.fact')}</Text>
              </Animated.View>

              <Animated.View
                style={[styles.overlay, styles.fakeOverlay, dynamicStyles.fakeOverlayBase, fakeOverlayStyle]}
              >
                <Text style={styles.overlayText}>{t('game.fake')}</Text>
              </Animated.View>

              <View style={styles.frontContent}>
                {categoryName
                  ? <View style={[styles.categoryBadge, dynamicStyles.categoryBadgeBg]}>
                    <Text style={[styles.category, dynamicStyles.categoryColor]}>{categoryName}</Text>
                  </View>
                  : null}

                <Text style={[styles.statementQuote, dynamicStyles.quoteColor]}>&laquo;</Text>
                <Text
                  style={[styles.frontStatement, dynamicStyles.statementColor]}
                  numberOfLines={8}
                  adjustsFontSizeToFit
                  minimumFontScale={0.65}
                >
                  {statement}
                </Text>
                <Text style={[styles.statementQuote, styles.quoteEnd, dynamicStyles.quoteColor]}>&raquo;</Text>
              </View>
            </Animated.View>
          </Animated.View>

          {/* BACK CARD (explanation) — always mounted, starts off-screen */}
          <Animated.View
            collapsable={false}
            style={[styles.backCard, backCardStyle]}
          >
            <Animated.View
              style={[styles.faceInner, dynamicStyles.faceInnerBase, backBorderStyle]}
            >
              <Pressable onPress={programmaticDismiss}>
                <View
                  style={[styles.resultBanner, dynamicStyles.topAccentRadius, { backgroundColor: resultBgColor }]}
                >
                  <MaterialCommunityIcons name={resultIcon} size={24} color="#FFFFFF" />
                  <Text style={styles.resultText}>{resultText}</Text>
                  <Feather name="chevron-right" size={18} color="rgba(255,255,255,0.6)" style={styles.resultChevron} />
                </View>
              </Pressable>

              <ScrollView
                style={styles.backBody}
                contentContainerStyle={styles.backBodyContent}
                showsVerticalScrollIndicator={false}
                nestedScrollEnabled
              >
                <BackFaceBody
                  statement={backFeedback?.statement ?? statement}
                  explanation={backFeedback?.explanation ?? preExplanation}
                  source={backFeedback?.source ?? preSource}
                  sourceUrl={backFeedback?.sourceUrl ?? preSourceUrl}
                  truthColor={truthColor}
                  truthLabel={truthLabel}
                  colors={backFaceColors}
                  t={t}
                />
              </ScrollView>
            </Animated.View>
          </Animated.View>
        </Animated.View>
      </GestureDetector>
    </View>
  );
});

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
  },
  stackCard: {
    position: 'absolute',
    left: 0,
    bottom: 0,
    height: '100%',
  },
  cardContainer: {
    minHeight: s(300),
    overflow: 'visible',
  },
  frontCard: {
    width: '100%',
    minHeight: s(300),
    overflow: 'visible',
  },
  backCard: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'visible',
  },
  faceInner: {
    flex: 1,
    overflow: 'hidden',
  },
  topAccent: {
    height: s(3),
    width: '100%',
  },
  frontContent: {
    paddingHorizontal: s(24),
    paddingVertical: s(32),
    flex: 1,
    justifyContent: 'center',
  },
  overlay: {
    position: 'absolute',
    top: s(24),
    paddingHorizontal: s(16),
    paddingVertical: s(8),
    zIndex: 10,
  },
  factOverlay: {
    right: 20,
  },
  fakeOverlay: {
    left: 20,
  },
  overlayText: {
    fontSize: s(18),
    fontFamily: fontFamily.bold,
    color: '#FFFFFF',
  },
  categoryBadge: {
    alignSelf: 'center',
    paddingHorizontal: s(14),
    paddingVertical: s(6),
    borderRadius: s(12),
    marginBottom: s(8),
    marginTop: s(12),
  },
  category: {
    fontSize: s(12),
    fontFamily: fontFamily.bold,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  statementQuote: {
    fontSize: s(32),
    fontFamily: fontFamily.black,
    lineHeight: s(32),
    textAlign: 'center',
  },
  quoteEnd: {
    textAlign: 'center',
  },
  frontStatement: {
    fontSize: s(22),
    fontFamily: fontFamily.bold,
    lineHeight: s(32),
    textAlign: 'center',
  },
  resultBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: s(8),
    paddingVertical: s(14),
    paddingHorizontal: s(24),
  },
  resultText: {
    fontSize: s(17),
    fontFamily: fontFamily.bold,
    color: '#FFFFFF',
  },
  resultChevron: {
    marginLeft: s(4),
  },
  backBody: {
    flex: 1,
  },
  backBodyContent: {
    padding: s(24),
  },
  backStatement: {
    fontSize: s(15),
    fontFamily: fontFamily.medium,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: s(22),
    marginBottom: s(12),
  },
  truthBadge: {
    alignSelf: 'center',
    paddingHorizontal: s(14),
    paddingVertical: s(5),
    borderRadius: s(16),
    marginBottom: s(16),
  },
  truthText: {
    fontSize: s(15),
    fontFamily: fontFamily.semiBold,
  },
  explanation: {
    fontSize: s(15),
    fontFamily: fontFamily.regular,
    lineHeight: s(22),
  },
  sourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(4),
    marginTop: s(8),
  },
  sourceText: {
    fontSize: s(11),
    fontFamily: fontFamily.medium,
  },
  sourceLink: {
    textDecorationLine: 'underline',
  },
});
