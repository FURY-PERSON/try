/**
 * Android-optimized card component.
 * Uses scaleX flip (squish -> swap -> expand) instead of rotateY to
 * completely eliminate top-clipping on Android.
 *
 * Key Android perf optimizations:
 * - No LinearGradient on animated card faces (expo-linear-gradient is slow on Android)
 *   Top accent replaced with solid View, result banner uses solid background
 * - collapsable={false} on animated views (prevents Android view-flattening)
 * - needsOffscreenAlphaCompositing on faces with opacity toggle
 * - mainEntranceStyle merged into cardDragStyle (fewer animated layers = fewer native updates/frame)
 * - Gesture memoized with useMemo (prevents native re-attach)
 * - Stable callback refs for onSwipe/onDismiss (prevents cascading recreations)
 * - All inline styles memoized (zero GC pressure during animation)
 * - Back face always mounted, no renderToHardwareTextureAndroid on back face
 * - activeFeedback via useMemo + ref (no extra re-render)
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
  withSequence,
  runOnJS,
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

type FlipPhase = 'front' | 'flipping' | 'back';

const FLIP_DURATION = 400;
const SNAP_DURATION = 180;
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
}, ref) => {
  const { colors, borderRadius, gradients } = useThemeContext();
  const { t } = useTranslation();
  const { width: screenWidth } = useWindowDimensions();

  const swipeThreshold = useMemo(() => screenWidth * 0.25, [screenWidth]);
  const dismissThreshold = useMemo(() => screenWidth * 0.20 / 1.1, [screenWidth]);
  const cardWidth = useMemo(() => screenWidth - 48, [screenWidth]);
  const halfScreen = screenWidth / 2;

  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const flipProgress = useSharedValue(0);
  const phase = useSharedValue<FlipPhase>('front');
  const entranceProgress = useSharedValue(1);
  const isSubmittingShared = useSharedValue(false);
  const isProgrammatic = useSharedValue(false);
  const isCorrectShared = useSharedValue(false);

  useEffect(() => {
    isSubmittingShared.value = isSubmitting;
  }, [isSubmitting, isSubmittingShared]);

  const [stackContent, setStackContent] = useState({ nextStatement, nextCategoryName });
  const [fourthCardReady, setFourthCardReady] = useState(true);

  // Stable refs for callbacks — prevents gesture/programmatic callbacks from recreating on parent re-render
  const onSwipeRef = useRef(onSwipe);
  onSwipeRef.current = onSwipe;
  const onDismissRef = useRef(onDismiss);
  onDismissRef.current = onDismiss;

  // useMemo — no extra re-render (unlike useState buffer)
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
    translateX.value = 0;
    translateY.value = 0;
    flipProgress.value = 0;
    phase.value = 'front';
    isProgrammatic.value = false;
    isCorrectShared.value = false;
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

  // Update correctness when feedback arrives
  useEffect(() => {
    if (activeFeedback) {
      isCorrectShared.value = activeFeedback.userAnsweredCorrectly;
      // Fallback: if flip wasn't started by gesture/button, start it now
      if (flipProgress.value === 0 && phase.value === 'front') {
        phase.value = 'flipping';
        flipProgress.value = withTiming(1, {
          duration: FLIP_DURATION,
          easing: Easing.inOut(Easing.ease),
        }, (finished) => {
          if (finished) phase.value = 'back';
        });
      }
    }
  }, [activeFeedback]);

  // Stable callbacks via refs — never recreated, so gesture & imperative handle stay stable
  const callOnSwipe = useCallback((direction: SwipeDirection) => {
    onSwipeRef.current(direction);
  }, []);

  const callOnDismiss = useCallback(() => {
    onDismissRef.current();
  }, []);

  const startFlip = useCallback(() => {
    phase.value = 'flipping';
    flipProgress.value = withTiming(1, {
      duration: FLIP_DURATION,
      easing: Easing.inOut(Easing.ease),
    }, (finished) => {
      if (finished) phase.value = 'back';
    });
  }, [phase, flipProgress]);

  const programmaticSwipe = useCallback((direction: SwipeDirection) => {
    if (isSubmittingShared.value) return;
    isProgrammatic.value = true;
    const peakX = direction === 'right' ? swipeThreshold * 1.2 : -swipeThreshold * 1.2;
    translateX.value = withSequence(
      withTiming(peakX, { duration: 140, easing: Easing.out(Easing.cubic) }),
      withTiming(0, { duration: 180, easing: Easing.inOut(Easing.cubic) }),
    );
    startFlip();
    callOnSwipe(direction);
  }, [swipeThreshold, callOnSwipe, isSubmittingShared, isProgrammatic, translateX, startFlip]);

  const programmaticDismiss = useCallback(() => {
    translateX.value = withTiming(
      screenWidth * 1.5,
      { duration: 200, easing: Easing.in(Easing.cubic) },
      (finished) => { if (finished) runOnJS(callOnDismiss)(); },
    );
  }, [screenWidth, callOnDismiss, translateX]);

  useImperativeHandle(ref, () => ({
    programmaticSwipe,
    programmaticDismiss,
  }), [programmaticSwipe, programmaticDismiss]);

  const SWIPE_SPEED_MULTIPLIER = 1.5;

  // Memoize gesture to avoid native handler re-attach on every render
  const gesture = useMemo(() => Gesture.Pan()
    .activeOffsetX([-15, 15])
    .onUpdate((event) => {
      if (phase.value === 'flipping') return;
      if (phase.value === 'front' && isSubmittingShared.value) return;
      translateX.value = event.translationX * SWIPE_SPEED_MULTIPLIER;
      translateY.value = event.translationY * 0.3;
    })
    .onEnd((event) => {
      if (phase.value === 'flipping') return;
      if (phase.value === 'front' && isSubmittingShared.value) return;

      const amplifiedX = event.translationX * SWIPE_SPEED_MULTIPLIER;
      const snap = { duration: SNAP_DURATION, easing: Easing.out(Easing.cubic) };

      if (phase.value === 'front') {
        if (amplifiedX > swipeThreshold) {
          translateX.value = withTiming(0, snap);
          translateY.value = withTiming(0, snap);
          phase.value = 'flipping';
          flipProgress.value = withTiming(1, {
            duration: FLIP_DURATION,
            easing: Easing.inOut(Easing.ease),
          }, (finished) => {
            if (finished) phase.value = 'back';
          });
          runOnJS(callOnSwipe)('right');
        } else if (amplifiedX < -swipeThreshold) {
          translateX.value = withTiming(0, snap);
          translateY.value = withTiming(0, snap);
          phase.value = 'flipping';
          flipProgress.value = withTiming(1, {
            duration: FLIP_DURATION,
            easing: Easing.inOut(Easing.ease),
          }, (finished) => {
            if (finished) phase.value = 'back';
          });
          runOnJS(callOnSwipe)('left');
        } else {
          translateX.value = withTiming(0, snap);
          translateY.value = withTiming(0, snap);
        }
      } else if (phase.value === 'back') {
        if (Math.abs(amplifiedX) > dismissThreshold) {
          const flyDir = amplifiedX > 0 ? 1 : -1;
          translateX.value = withTiming(
            flyDir * screenWidth * 1.5,
            { duration: 200, easing: Easing.in(Easing.cubic) },
            (finished) => { if (finished) runOnJS(callOnDismiss)(); },
          );
          translateY.value = withTiming(0, { duration: 200 });
        } else {
          translateX.value = withTiming(0, snap);
          translateY.value = withTiming(0, snap);
        }
      }
    }), [swipeThreshold, dismissThreshold, screenWidth, callOnSwipe, callOnDismiss]);

  // --- Animated styles (merged where possible to reduce animated layer count) ---

  // Merged: mainEntranceStyle + cardDragStyle into one (saves 1 animated layer = 1 fewer native update/frame)
  const cardAnimStyle = useAnimatedStyle(() => {
    'worklet';
    const ep = entranceProgress.value;
    const rotation = interpolate(
      translateX.value,
      [-halfScreen, 0, halfScreen],
      [-15, 0, 15],
      Extrapolation.CLAMP,
    );
    return {
      transform: [
        { scale: 0.96 + ep * 0.04 },
        { translateY: 12 - ep * 12 },
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotateZ: `${rotation}deg` },
      ],
    };
  });

  // scaleX flip: 1 -> 0 -> 1, front visible first half, back visible second half
  const frontFaceStyle = useAnimatedStyle(() => {
    'worklet';
    const fp = flipProgress.value;
    const scaleX = fp <= 0.5
      ? 1 - fp * 2       // 1 -> 0
      : (fp - 0.5) * 2;  // 0 -> 1
    return {
      transform: [{ scaleX }],
      opacity: fp <= 0.5 ? 1 : 0,
    };
  });

  const backFaceStyle = useAnimatedStyle(() => {
    'worklet';
    const fp = flipProgress.value;
    const scaleX = fp <= 0.5
      ? 1 - fp * 2
      : (fp - 0.5) * 2;
    return {
      transform: [{ scaleX }],
      opacity: fp > 0.5 ? 1 : 0,
    };
  });

  // Smooth border: gray -> green/red during swipe, then result color after flip
  const borderColorDefault = colors.border;
  const cardBorderStyle = useAnimatedStyle(() => {
    'worklet';
    const fp = flipProgress.value;

    if (isSubmittingShared.value && fp === 0) {
      return { borderColor: 'rgba(99, 102, 241, 0.3)', borderWidth: 2 };
    }

    if (fp > 0) {
      const correctColor = interpolateColor(
        fp, [0, 0.5, 1],
        [borderColorDefault, borderColorDefault, 'rgba(16, 185, 68, 0.45)'],
      );
      const incorrectColor = interpolateColor(
        fp, [0, 0.5, 1],
        [borderColorDefault, borderColorDefault, 'rgba(239, 68, 68, 0.45)'],
      );
      return {
        borderColor: isCorrectShared.value ? correctColor : incorrectColor,
        borderWidth: 2,
      };
    }

    if (isProgrammatic.value) {
      return { borderColor: borderColorDefault, borderWidth: 2 };
    }

    const progress = interpolate(
      translateX.value,
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

  const factOverlayStyle = useAnimatedStyle(() => {
    'worklet';
    if (flipProgress.value > 0 || isProgrammatic.value) return { opacity: 0 };
    return {
      opacity: interpolate(
        translateX.value, [0, swipeThreshold], [0, 1], Extrapolation.CLAMP,
      ),
    };
  });

  const fakeOverlayStyle = useAnimatedStyle(() => {
    'worklet';
    if (flipProgress.value > 0 || isProgrammatic.value) return { opacity: 0 };
    return {
      opacity: interpolate(
        translateX.value, [-swipeThreshold, 0], [1, 0], Extrapolation.CLAMP,
      ),
    };
  });

  // Stack styles
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

  // Back face derived values — use backFeedback (ref-backed, no state)
  const isCorrectBack = backFeedback?.userAnsweredCorrectly;
  const resultBgColor = isCorrectBack ? gradients.success[0] : gradients.danger[0];
  const resultIcon = isCorrectBack ? 'check-circle' : 'close-circle';
  const resultText = isCorrectBack ? t('game.correct') : t('game.incorrect');
  const truthLabel = backFeedback?.isTrue ? t('game.fact') : t('game.fake');
  const truthColor = backFeedback?.isTrue ? colors.emerald : colors.red;

  // Memoize all inline style objects to avoid GC pressure and unnecessary native updates
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
    // Solid color replacing gradient for front face top accent (3px)
    topAccentColor: { backgroundColor: gradients.primary[0] } as const,
  }), [cardWidth, colors, borderRadius, gradients]);

  // Memoize BackFaceBody colors prop to prevent re-render when parent re-renders
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

      {/* Second card in stack — keeps LinearGradient (not animated, so perf is fine) */}
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

      {/* Main interactive card */}
      <GestureDetector gesture={gesture}>
        <Animated.View
          collapsable={false}
          style={[styles.card, dynamicStyles.card, cardAnimStyle]}
        >
          {/* FRONT FACE */}
          <Animated.View
            collapsable={false}
            needsOffscreenAlphaCompositing
            renderToHardwareTextureAndroid
            style={[styles.faceOuter, frontFaceStyle]}
          >
            <Animated.View
              style={[styles.faceInner, dynamicStyles.faceInnerBase, cardBorderStyle]}
            >
              {/* Solid View instead of LinearGradient — much cheaper on Android during animation */}
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
                <View style={[styles.categoryBadge, dynamicStyles.categoryBadgeBg]}>
                  <Text style={[styles.category, dynamicStyles.categoryColor]}>{categoryName}</Text>
                </View>
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

          {/* BACK FACE — always mounted, no renderToHardwareTextureAndroid (avoids re-rasterize on content change) */}
          <Animated.View
            collapsable={false}
            needsOffscreenAlphaCompositing
            style={[styles.backFaceOuter, backFaceStyle]}
          >
            <Animated.View
              style={[styles.faceInner, dynamicStyles.faceInnerBase, cardBorderStyle]}
            >
              <Pressable onPress={programmaticDismiss}>
                {/* Solid background instead of LinearGradient — saves expensive native gradient draw during flip */}
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
                  statement={backFeedback?.statement}
                  explanation={backFeedback?.explanation}
                  source={backFeedback?.source}
                  sourceUrl={backFeedback?.sourceUrl}
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
  card: {
    minHeight: 300,
    overflow: 'visible',
  },
  faceOuter: {
    width: '100%',
    minHeight: 300,
    overflow: 'visible',
  },
  backFaceOuter: {
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
    height: 3,
    width: '100%',
  },
  frontContent: {
    paddingHorizontal: 24,
    paddingVertical: 32,
    flex: 1,
    justifyContent: 'center',
  },
  overlay: {
    position: 'absolute',
    top: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
    zIndex: 10,
  },
  factOverlay: {
    right: 20,
  },
  fakeOverlay: {
    left: 20,
  },
  overlayText: {
    fontSize: 18,
    fontFamily: fontFamily.bold,
    color: '#FFFFFF',
  },
  categoryBadge: {
    alignSelf: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 9999,
    marginBottom: 8,
    marginTop: 12,
  },
  category: {
    fontSize: 11,
    fontFamily: fontFamily.bold,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  statementQuote: {
    fontSize: 32,
    fontFamily: fontFamily.black,
    lineHeight: 32,
    textAlign: 'center',
  },
  quoteEnd: {
    textAlign: 'center',
  },
  frontStatement: {
    fontSize: 22,
    fontFamily: fontFamily.bold,
    lineHeight: 32,
    textAlign: 'center',
  },
  resultBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  resultText: {
    fontSize: 17,
    fontFamily: fontFamily.bold,
    color: '#FFFFFF',
  },
  resultChevron: {
    marginLeft: 4,
  },
  backBody: {
    flex: 1,
  },
  backBodyContent: {
    padding: 24,
  },
  backStatement: {
    fontSize: 15,
    fontFamily: fontFamily.medium,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 12,
  },
  truthBadge: {
    alignSelf: 'center',
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 16,
    marginBottom: 16,
  },
  truthText: {
    fontSize: 15,
    fontFamily: fontFamily.semiBold,
  },
  explanation: {
    fontSize: 15,
    fontFamily: fontFamily.regular,
    lineHeight: 22,
  },
  sourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  sourceText: {
    fontSize: 11,
    fontFamily: fontFamily.medium,
  },
  sourceLink: {
    textDecorationLine: 'underline',
  },
});
