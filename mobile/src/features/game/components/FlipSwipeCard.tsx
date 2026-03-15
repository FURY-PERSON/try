import React, { useEffect, useMemo, useState, useImperativeHandle, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Linking,
  Pressable,
  ScrollView,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
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
import { FlipSwipeCardAndroid } from './FlipSwipeCardAndroid';
import { s, isTablet } from '@/utils/scale';

// Static transform object — avoids per-frame allocation in worklets
const PERSPECTIVE = { perspective: 1200 } as const;

function getStatementFontSize(text: string): number {
  const len = text.length;
  const base = len > 200 ? 14 : len > 150 ? 16 : len > 100 ? 18 : len > 60 ? 20 : 22;
  return s(base);
}

// Static LinearGradient point objects
const GRADIENT_START = { x: 0, y: 0 } as const;
const GRADIENT_END_H = { x: 1, y: 0 } as const;

type AnswerFeedback = {
  statement: string;
  isTrue: boolean;
  userAnsweredCorrectly: boolean;
  explanation: string;
  source: string;
  sourceUrl?: string;
};

export type FlipSwipeCardRef = {
  programmaticSwipe: (direction: SwipeDirection) => void;
  programmaticDismiss: () => void;
};

export type FlipSwipeCardProps = {
  statement: string;
  categoryName: string;
  cardIndex: number;
  totalCards: number;
  feedback: AnswerFeedback | null;
  onSwipe: (direction: SwipeDirection) => void;
  onDismiss: () => void;
  disabled?: boolean;
  isSubmitting?: boolean;
  nextStatement?: string;
  nextCategoryName?: string;
  /** Pre-render data for the explanation card (Android only) */
  explanation?: string;
  source?: string;
  sourceUrl?: string;
  isTrue?: boolean;
};

type FlipPhase = 'front' | 'flipping' | 'back';

const FlipSwipeCardInner = React.forwardRef<FlipSwipeCardRef, FlipSwipeCardProps>(({
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
  const { colors, borderRadius, elevation, gradients } = useThemeContext();
  const { t } = useTranslation();
  const { width: screenWidth } = useWindowDimensions();

  const swipeThreshold = useMemo(() => screenWidth * 0.25, [screenWidth]);
  const dismissThreshold = useMemo(() => screenWidth * 0.20 / 1.1, [screenWidth]);
  const cardWidth = useMemo(() => isTablet ? screenWidth * 0.6 : screenWidth - 48, [screenWidth]);
  const cardHeight = isTablet ? cardWidth : undefined;

  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const flipProgress = useSharedValue(0);
  const phase = useSharedValue<FlipPhase>('front');
  const entranceProgress = useSharedValue(1);
  const isSubmittingShared = useSharedValue(false);
  const isProgrammatic = useSharedValue(false);
  const isCorrectShared = useSharedValue(false);

  const FLIP_DURATION = 500;

  // Sync isSubmitting prop -> shared value (avoids gesture handler recreation)
  useEffect(() => {
    isSubmittingShared.value = isSubmitting;
  }, [isSubmitting, isSubmittingShared]);

  // Stack card content is buffered to prevent flashing the next card's text
  // while the main card is still transitioning. The update is delayed by one
  // requestAnimationFrame so the UI thread has time to reposition the main
  // card to center before React re-renders the stack content.
  const [stackContent, setStackContent] = useState({ nextStatement, nextCategoryName });
  // 4th card slot is hidden during transition and only becomes available
  // after the entrance animation (300ms) fully completes.
  const [fourthCardReady, setFourthCardReady] = useState(true);

  // Guard against stale feedback from a previous card
  const activeFeedback = useMemo(
    () => (feedback?.statement === statement ? feedback : null),
    [feedback, statement],
  );

  // Reset animation state when cardIndex changes
  useEffect(() => {
    translateX.value = 0;
    translateY.value = 0;
    flipProgress.value = 0; // instant snap, no animation
    phase.value = 'front';
    isProgrammatic.value = false;
    isCorrectShared.value = false;
    entranceProgress.value = 0;
    entranceProgress.value = withTiming(1, { duration: 300, easing: Easing.out(Easing.cubic) });
    // Hide 4th card immediately on transition start
    setFourthCardReady(false);
    // Delay by one frame so the UI thread applies translateX=0 (main card
    // covers the stack) before React re-renders with the new stack content.
    const raf = requestAnimationFrame(() => {
      setStackContent({ nextStatement, nextCategoryName });
    });
    // Show 4th card only after entrance animation completes (300ms)
    const timer = setTimeout(() => setFourthCardReady(true), 300);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
    };
  }, [cardIndex]);

  // Trigger flip when feedback arrives
  useEffect(() => {
    if (activeFeedback && flipProgress.value === 0) {
      isCorrectShared.value = activeFeedback.userAnsweredCorrectly;
      phase.value = 'flipping';
      flipProgress.value = withTiming(180, {
        duration: FLIP_DURATION,
        easing: Easing.inOut(Easing.ease),
      }, (finished) => {
        if (finished) {
          phase.value = 'back';
        }
      });
    }
  }, [activeFeedback]);

  // Stable callback refs — allows gesture to be memoized without capturing stale onSwipe/onDismiss
  const onSwipeRef = useRef(onSwipe);
  onSwipeRef.current = onSwipe;
  const onDismissRef = useRef(onDismiss);
  onDismissRef.current = onDismiss;
  const callOnSwipe = useCallback((direction: SwipeDirection) => { onSwipeRef.current(direction); }, []);
  const callOnDismiss = useCallback(() => { onDismissRef.current(); }, []);

  // Imperative methods for programmatic swipe/dismiss
  const programmaticSwipe = useCallback((direction: SwipeDirection) => {
    if (isSubmittingShared.value) return;
    isProgrammatic.value = true;
    const peakX = direction === 'right' ? swipeThreshold * 1.2 : -swipeThreshold * 1.2;
    translateX.value = withSequence(
      withTiming(peakX, { duration: 150, easing: Easing.out(Easing.cubic) }),
      withSpring(0, { damping: 26, stiffness: 200 }),
    );
    callOnSwipe(direction);
  }, [swipeThreshold, callOnSwipe, isSubmittingShared, isProgrammatic, translateX]);

  const programmaticDismiss = useCallback(() => {
    translateX.value = withTiming(
      screenWidth * 1.5,
      { duration: 200, easing: Easing.in(Easing.cubic) },
      (finished) => {
        if (finished) runOnJS(callOnDismiss)();
      },
    );
  }, [screenWidth, callOnDismiss, translateX]);

  useImperativeHandle(ref, () => ({
    programmaticSwipe,
    programmaticDismiss,
  }), [programmaticSwipe, programmaticDismiss]);

  // Card moves faster than finger for snappier feel
  const SWIPE_SPEED_MULTIPLIER = 1.5;

  // Memoize gesture to prevent native handler re-attach on every render (same pattern as Android)
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
      const amplifiedVelocityX = event.velocityX * SWIPE_SPEED_MULTIPLIER;

      const snapBack = { duration: 200, easing: Easing.out(Easing.cubic) };
      const flipReturn = { duration: FLIP_DURATION, easing: Easing.inOut(Easing.ease) };

      // Dynamic inertia: 0 at ≤800 px/s, scales up to 1 at ≥1600 px/s
      const absVel = Math.abs(event.velocityX);
      const inertiaFactor = Math.min(1, Math.max(0, (absVel - 800) / 800));

      const springToZero = (vel: number) =>
        withSpring(0, { velocity: vel, damping: 18, stiffness: 120, mass: 1 });

      const answerSpring = (vel: number) =>
        withSpring(0, { velocity: vel, damping: 26, stiffness: 200, mass: 1 });

      if (phase.value === 'front') {
        if (amplifiedX > swipeThreshold) {
          translateX.value = answerSpring(amplifiedVelocityX * inertiaFactor);
          translateY.value = withTiming(0, flipReturn);
          runOnJS(callOnSwipe)('right');
        } else if (amplifiedX < -swipeThreshold) {
          translateX.value = answerSpring(amplifiedVelocityX * inertiaFactor);
          translateY.value = withTiming(0, flipReturn);
          runOnJS(callOnSwipe)('left');
        } else {
          translateX.value = springToZero(amplifiedVelocityX * inertiaFactor);
          translateY.value = withTiming(0, snapBack);
        }
      } else if (phase.value === 'back') {
        if (Math.abs(amplifiedX) > dismissThreshold) {
          const flyDir = amplifiedX > 0 ? 1 : -1;
          translateX.value = withTiming(
            flyDir * screenWidth * 1.5,
            { duration: 200, easing: Easing.in(Easing.cubic) },
            (finished) => {
              if (finished) runOnJS(callOnDismiss)();
            },
          );
          translateY.value = withTiming(0, { duration: 200 });
        } else {
          translateX.value = springToZero(amplifiedVelocityX * inertiaFactor);
          translateY.value = withTiming(0, snapBack);
        }
      }
    }), [swipeThreshold, dismissThreshold, screenWidth, callOnSwipe, callOnDismiss]);

  // Card transform (translate + rotate from drag)
  const halfScreen = screenWidth / 2;
  const cardDragStyle = useAnimatedStyle(() => {
    'worklet';
    const rotation = interpolate(
      translateX.value,
      [-halfScreen, 0, halfScreen],
      [-15, 0, 15],
      Extrapolation.CLAMP,
    );
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotateZ: `${rotation}deg` },
      ],
    };
  });

  // Front face: 0 -> 180deg (opacity toggle at 90deg for Android reliability)
  const frontFaceStyle = useAnimatedStyle(() => {
    'worklet';
    const fp = flipProgress.value;
    return {
      transform: [
        PERSPECTIVE,
        { rotateY: `${fp}deg` },
      ],
      opacity: fp < 90 ? 1 : 0,
    };
  });

  // Back face: 180 -> 360deg (opacity toggle at 90deg for Android reliability)
  const backFaceStyle = useAnimatedStyle(() => {
    'worklet';
    const fp = flipProgress.value;
    return {
      transform: [
        PERSPECTIVE,
        { rotateY: `${fp + 180}deg` },
      ],
      opacity: fp < 90 ? 0 : 1,
    };
  });

  // Combined glow + submitting border — smooth interpolateColor transition
  const borderColorDefault = colors.border;
  const cardBorderStyle = useAnimatedStyle(() => {
    'worklet';
    const fp = flipProgress.value;
    // Submitting state takes priority (only on front face)
    if (isSubmittingShared.value && fp === 0) {
      return {
        borderColor: 'rgba(99, 102, 241, 0.3)',
        borderWidth: 2,
      };
    }
    // After flip starts: animate border to result color
    if (fp > 0) {
      const flipNorm = fp / 180; // 0→1
      const correctColor = interpolateColor(
        flipNorm, [0, 0.5, 1],
        [borderColorDefault, borderColorDefault, 'rgba(16, 185, 68, 0.45)'],
      );
      const incorrectColor = interpolateColor(
        flipNorm, [0, 0.5, 1],
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
    // During swipe: smooth gray → green / gray → red
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

  // FACT overlay opacity (front only, hidden during programmatic swipe)
  const factOverlayStyle = useAnimatedStyle(() => {
    'worklet';
    if (flipProgress.value > 0 || isProgrammatic.value) return { opacity: 0 };
    return {
      opacity: interpolate(
        translateX.value,
        [0, swipeThreshold],
        [0, 1],
        Extrapolation.CLAMP,
      ),
    };
  });

  // FAKE overlay opacity (front only, hidden during programmatic swipe)
  const fakeOverlayStyle = useAnimatedStyle(() => {
    'worklet';
    if (flipProgress.value > 0 || isProgrammatic.value) return { opacity: 0 };
    return {
      opacity: interpolate(
        translateX.value,
        [-swipeThreshold, 0],
        [1, 0],
        Extrapolation.CLAMP,
      ),
    };
  });

  // Peek offsets — scaled up on iPad so the stack is visible on larger cards
  const peekInit = s(12);
  const peek2Start = s(24);
  const peek3Start = s(36);
  const peek4Start = s(48);

  const secondStackStyle = useAnimatedStyle(() => {
    'worklet';
    const ep = entranceProgress.value;
    return {
      transform: [{ scale: 0.92 + ep * 0.04 }],
      top: peek2Start - ep * peekInit,
      opacity: 1,
    };
  });

  const thirdStackStyle = useAnimatedStyle(() => {
    'worklet';
    const ep = entranceProgress.value;
    return {
      transform: [{ scale: 0.88 + ep * 0.04 }],
      top: peek3Start - ep * peekInit,
      opacity: 0.5,
    };
  });

  const fourthStackStyle = useAnimatedStyle(() => {
    'worklet';
    const ep = entranceProgress.value;
    return {
      transform: [{ scale: 0.84 + ep * 0.04 }],
      top: peek4Start - ep * peekInit,
      opacity: 0,
    };
  });

  // Main card entrance — animate from stack position to full size
  const mainEntranceStyle = useAnimatedStyle(() => {
    'worklet';
    const ep = entranceProgress.value;
    return {
      transform: [
        { scale: 0.96 + ep * 0.04 },
        { translateY: 12 - ep * 12 },
      ],
    };
  });

  const remainingCards = totalCards - cardIndex;

  const handleSourcePress = () => {
    if (activeFeedback?.sourceUrl) {
      Linking.openURL(activeFeedback.sourceUrl);
    }
  };

  const resultGradient: [string, string] = activeFeedback?.userAnsweredCorrectly
    ? gradients.success
    : gradients.danger;
  const resultIcon = activeFeedback?.userAnsweredCorrectly
    ? 'check-circle'
    : 'close-circle';
  const resultText = activeFeedback?.userAnsweredCorrectly
    ? t('game.correct')
    : t('game.incorrect');
  const truthLabel = activeFeedback?.isTrue ? t('game.fact') : t('game.fake');
  const truthColor = activeFeedback?.isTrue ? colors.emerald : colors.red;

  // Dynamic styles for dimension-dependent widths
  const dynamicStyles = useMemo(() => ({
    wrapper: isTablet ? { width: cardWidth, alignSelf: 'center' as const } : undefined,
    stackCard: { width: cardWidth, ...(cardHeight ? { height: cardHeight } : {}) },
    card: { width: cardWidth, ...(cardHeight ? { height: cardHeight } : {}) },
  }), [cardWidth, cardHeight]);


  return (
    <View style={[styles.wrapper, dynamicStyles.wrapper]}>
      {/* Fourth card in stack (opacity 0, pre-rendered after entrance animation) */}
      {remainingCards > 3 && fourthCardReady && (
        <Animated.View
          style={[
            styles.stackCard,
            dynamicStyles.stackCard,
            {
              backgroundColor: colors.surface,
              borderRadius: borderRadius.xxl,
              borderWidth: 2,
              borderColor: colors.border,
            },
            fourthStackStyle,
          ]}
        />
      )}

      {/* Third card in stack */}
      {remainingCards > 2 && (
        <Animated.View
          style={[
            styles.stackCard,
            dynamicStyles.stackCard,
            {
              backgroundColor: colors.surface,
              borderRadius: borderRadius.xxl,
              borderWidth: 2,
              borderColor: colors.border,
            },
            thirdStackStyle,
          ]}
        />
      )}

      {/* Second card in stack */}
      {remainingCards > 1 && (
        <Animated.View
          style={[
            styles.stackCard,
            dynamicStyles.stackCard,
            {
              backgroundColor: colors.surface,
              borderRadius: borderRadius.xxl,
              borderWidth: 2,
              borderColor: colors.border,
              overflow: 'hidden',
            },
            secondStackStyle,
          ]}
        >
          <LinearGradient
            colors={gradients.primary}
            start={GRADIENT_START}
            end={GRADIENT_END_H}
            style={[
              styles.topAccent,
              {
                borderTopLeftRadius: borderRadius.xxl,
                borderTopRightRadius: borderRadius.xxl,
              },
            ]}
          />
          {stackContent.nextStatement ? (
            <View style={styles.frontContent}>
              {stackContent.nextCategoryName ? (
                <View
                  style={[
                    styles.categoryBadge,
                    { backgroundColor: colors.primary + '12' },
                  ]}
                >
                  <Text style={[styles.category, { color: colors.primary }]}>
                    {stackContent.nextCategoryName}
                  </Text>
                </View>
              ) : null}
              <Text style={[styles.statementQuote, { color: colors.primary }]}>
                &laquo;
              </Text>
              <Text
                style={[
                  styles.frontStatement,
                  {
                    color: colors.textPrimary,
                    fontSize: getStatementFontSize(stackContent.nextStatement ?? ''),
                  },
                ]}
                numberOfLines={8}
              >
                {stackContent.nextStatement}
              </Text>
              <Text
                style={[styles.statementQuote, styles.quoteEnd, { color: colors.primary }]}
              >
                &raquo;
              </Text>
            </View>
          ) : null}
        </Animated.View>
      )}

      {/* Main interactive card */}
      <GestureDetector gesture={gesture}>
        <Animated.View
          renderToHardwareTextureAndroid
          style={[
            styles.card,
            dynamicStyles.card,
            mainEntranceStyle,
            cardDragStyle,
          ]}
        >
          {/* ---- FRONT FACE ---- */}
          <Animated.View renderToHardwareTextureAndroid style={[styles.faceOuter, frontFaceStyle]}>
            <Animated.View
              style={[styles.faceInner, { backgroundColor: colors.surface, borderRadius: borderRadius.xxl, ...elevation.lg }, cardBorderStyle]}
            >
            <LinearGradient
              colors={gradients.primary}
              start={GRADIENT_START}
              end={GRADIENT_END_H}
              style={[
                styles.topAccent,
                {
                  borderTopLeftRadius: borderRadius.xxl,
                  borderTopRightRadius: borderRadius.xxl,
                },
              ]}
            />

            <Animated.View
              style={[
                styles.overlay,
                styles.factOverlay,
                {
                  backgroundColor: colors.emerald,
                  borderRadius: borderRadius.sm,
                },
                factOverlayStyle,
              ]}
            >
              <Text style={styles.overlayText}>{t('game.fact')}</Text>
            </Animated.View>

            <Animated.View
              style={[
                styles.overlay,
                styles.fakeOverlay,
                {
                  backgroundColor: colors.red,
                  borderRadius: borderRadius.sm,
                },
                fakeOverlayStyle,
              ]}
            >
              <Text style={styles.overlayText}>{t('game.fake')}</Text>
            </Animated.View>

            <View style={styles.frontContent}>
              {categoryName
                ?              <View
                style={[
                  styles.categoryBadge,
                  { backgroundColor: colors.primary + '12' },
                ]}
              >
                <Text style={[styles.category, { color: colors.primary }]}>
                  {categoryName}
                </Text>
              </View>
                : null}


              <Text
                style={[styles.statementQuote, { color: colors.primary }]}
              >
                &laquo;
              </Text>
              <Text
                style={[
                  styles.frontStatement,
                  {
                    color: colors.textPrimary,
                    fontSize: getStatementFontSize(statement),
                  },
                ]}
              >
                {statement}
              </Text>
              <Text
                style={[
                  styles.statementQuote,
                  styles.quoteEnd,
                  { color: colors.primary },
                ]}
              >
                &raquo;
              </Text>
            </View>
            </Animated.View>
          </Animated.View>

          {/* ---- BACK FACE ---- */}
          <Animated.View renderToHardwareTextureAndroid style={[styles.backFaceOuter, backFaceStyle]}>
            <Animated.View
              style={[styles.faceInner, { backgroundColor: colors.surface, borderRadius: borderRadius.xxl, ...elevation.lg }, cardBorderStyle]}
            >
            {activeFeedback && (
              <>
                <Pressable onPress={programmaticDismiss}>
                  <LinearGradient
                    colors={resultGradient}
                    start={GRADIENT_START}
                    end={GRADIENT_END_H}
                    style={[
                      styles.resultBanner,
                      {
                        borderTopLeftRadius: borderRadius.xxl,
                        borderTopRightRadius: borderRadius.xxl,
                      },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={resultIcon}
                      size={24}
                      color="#FFFFFF"
                    />
                    <Text style={styles.resultText}>{resultText}</Text>
                    <Feather name="chevron-right" size={18} color="rgba(255,255,255,0.6)" style={styles.resultChevron} />
                  </LinearGradient>
                </Pressable>

                <ScrollView
                  style={styles.backBody}
                  contentContainerStyle={styles.backBodyContent}
                  showsVerticalScrollIndicator={false}
                  nestedScrollEnabled
                >
                  <Text
                    style={[
                      styles.backStatement,
                      { color: colors.textSecondary },
                    ]}
                    numberOfLines={3}
                  >
                    &laquo;{activeFeedback.statement}&raquo;
                  </Text>

                  <View
                    style={[
                      styles.truthBadge,
                      { backgroundColor: truthColor + '15' },
                    ]}
                  >
                    <Text
                      style={[styles.truthText, { color: truthColor }]}
                    >
                      {t('game.thisIs')} {truthLabel}
                    </Text>
                  </View>

                  <Text
                    style={[
                      styles.explanation,
                      { color: colors.textPrimary },
                    ]}
                  >
                    {activeFeedback.explanation}
                  </Text>

                  {activeFeedback.source ? (
                    <Pressable
                      onPress={handleSourcePress}
                      style={styles.sourceRow}
                    >
                      <Feather
                        name="link"
                        size={12}
                        color={colors.textTertiary}
                      />
                      <Text
                        style={[
                          styles.sourceText,
                          { color: colors.textTertiary },
                          activeFeedback.sourceUrl && styles.sourceLink,
                        ]}
                      >
                        {activeFeedback.source}
                      </Text>
                    </Pressable>
                  ) : null}
                </ScrollView>
              </>
            )}
            </Animated.View>
          </Animated.View>
        </Animated.View>
      </GestureDetector>
    </View>
  );
});

export const FlipSwipeCard = Platform.OS === 'android'
  ? React.memo(FlipSwipeCardAndroid)
  : React.memo(FlipSwipeCardInner);

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
  },
  stackCard: {
    position: 'absolute',
    top: 0,
    height: '100%',
  },
  card: {
    minHeight: s(300),
    overflow: 'visible',
  },
  faceOuter: {
    width: '100%',
    minHeight: s(300),
    flex: 1,
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
    fontFamily: fontFamily.bold,
    lineHeight: s(32),
    textAlign: 'center',
  },
  // Back face styles
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

