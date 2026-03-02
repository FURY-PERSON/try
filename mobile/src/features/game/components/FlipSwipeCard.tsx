import React, { useEffect, useMemo, useState } from 'react';
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
  withSpring,
  runOnJS,
  interpolate,
  Extrapolation,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useThemeContext } from '@/theme';
import { fontFamily } from '@/theme/typography';
import type { FC } from 'react';
import type { SwipeDirection } from '../types';

// Static transform object — avoids per-frame allocation in worklets
const PERSPECTIVE = { perspective: 1200 } as const;

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

type FlipSwipeCardProps = {
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
};

type FlipPhase = 'front' | 'flipping' | 'back';

const FlipSwipeCardInner: FC<FlipSwipeCardProps> = ({
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
}) => {
  const { colors, borderRadius, elevation, gradients } = useThemeContext();
  const { t } = useTranslation();
  const { width: screenWidth } = useWindowDimensions();

  const swipeThreshold = useMemo(() => screenWidth * 0.25, [screenWidth]);
  const dismissThreshold = useMemo(() => screenWidth * 0.20 / 1.1, [screenWidth]);
  const cardWidth = useMemo(() => screenWidth - 48, [screenWidth]);

  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const flipProgress = useSharedValue(0);
  const phase = useSharedValue<FlipPhase>('front');
  const entranceProgress = useSharedValue(1);
  const isSubmittingShared = useSharedValue(false);

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

  // Card moves 2.5x faster than finger for snappier feel
  const SWIPE_SPEED_MULTIPLIER = 1.3;

  const gesture = Gesture.Pan()
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

      // withSpring with velocity gives natural inertia — card overshoots
      // then settles to target in one smooth animation (no jerk)
      const springToZero = (vel: number) =>
        withSpring(0, { velocity: vel, damping: 18, stiffness: 120, mass: 1 });

      if (phase.value === 'front') {
        // Phase 1: swipe to answer
        if (amplifiedX > swipeThreshold) {
          translateX.value = springToZero(amplifiedVelocityX * inertiaFactor);
          translateY.value = withTiming(0, flipReturn);
          runOnJS(onSwipe)('right');
        } else if (amplifiedX < -swipeThreshold) {
          translateX.value = springToZero(amplifiedVelocityX * inertiaFactor);
          translateY.value = withTiming(0, flipReturn);
          runOnJS(onSwipe)('left');
        } else {
          // Below threshold — spring back with inertia
          translateX.value = springToZero(amplifiedVelocityX * inertiaFactor);
          translateY.value = withTiming(0, snapBack);
        }
      } else if (phase.value === 'back') {
        // Phase 2: swipe to dismiss
        if (Math.abs(amplifiedX) > dismissThreshold) {
          const flyDir = amplifiedX > 0 ? 1 : -1;
          translateX.value = withTiming(
            flyDir * screenWidth * 1.5,
            { duration: 200, easing: Easing.in(Easing.cubic) },
            (finished) => {
              if (finished) runOnJS(onDismiss)();
            },
          );
          translateY.value = withTiming(0, { duration: 200 });
        } else {
          translateX.value = springToZero(amplifiedVelocityX * inertiaFactor);
          translateY.value = withTiming(0, snapBack);
        }
      }
    });

  // Card transform (translate + rotate from drag)
  const cardDragStyle = useAnimatedStyle(() => {
    const rotation = interpolate(
      translateX.value,
      [-screenWidth / 2, 0, screenWidth / 2],
      [-15, 0, 15],
      Extrapolation.CLAMP,
    );
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotate: `${rotation}deg` },
      ],
    };
  });

  // Front face: 0 -> 180deg (opacity toggle at 90deg for Android reliability)
  const frontFaceStyle = useAnimatedStyle(() => {
    return {
      transform: [
        PERSPECTIVE,
        { rotateY: `${flipProgress.value}deg` },
      ],
      opacity: flipProgress.value < 90 ? 1 : 0,
    };
  });

  // Back face: 180 -> 360deg (opacity toggle at 90deg for Android reliability)
  const backFaceStyle = useAnimatedStyle(() => {
    return {
      transform: [
        PERSPECTIVE,
        { rotateY: `${flipProgress.value + 180}deg` },
      ],
      opacity: flipProgress.value < 90 ? 0 : 1,
    };
  });

  // Combined glow + submitting border (replaces separate cardGlowStyle + submittingStyle)
  const cardBorderStyle = useAnimatedStyle(() => {
    // Submitting state takes priority (only on front face)
    if (isSubmittingShared.value && flipProgress.value === 0) {
      return {
        borderColor: 'rgba(99, 102, 241, 0.3)',
        borderWidth: 2,
      };
    }
    if (flipProgress.value > 0) {
      return { borderColor: colors.border, borderWidth: 2 };
    }
    const progress = interpolate(
      translateX.value,
      [-swipeThreshold, 0, swipeThreshold],
      [-1, 0, 1],
      Extrapolation.CLAMP,
    );
    const absProgress = Math.abs(progress);
    if (absProgress < 0.01) {
      return { borderColor: colors.border, borderWidth: 2 };
    }
    const glowOpacity = absProgress * 0.19;
    const isRight = progress > 0;
    const r = isRight ? 16 : 239;
    const g = isRight ? 185 : 68;
    const b = isRight ? 129 : 68;
    return {
      borderColor: `rgba(${r}, ${g}, ${b}, ${glowOpacity})`,
      borderWidth: 2,
    };
  });

  // FACT overlay opacity (front only)
  const factOverlayStyle = useAnimatedStyle(() => {
    if (flipProgress.value > 0) return { opacity: 0 };
    const o = interpolate(
      translateX.value,
      [0, swipeThreshold],
      [0, 1],
      Extrapolation.CLAMP,
    );
    return { opacity: o };
  });

  // FAKE overlay opacity (front only)
  const fakeOverlayStyle = useAnimatedStyle(() => {
    if (flipProgress.value > 0) return { opacity: 0 };
    const o = interpolate(
      translateX.value,
      [-swipeThreshold, 0],
      [1, 0],
      Extrapolation.CLAMP,
    );
    return { opacity: o };
  });

  const secondStackStyle = useAnimatedStyle(() => {
    const scale = interpolate(entranceProgress.value, [0, 1], [0.92, 0.96]);
    const top = interpolate(entranceProgress.value, [0, 1], [24, 12]);
    return { transform: [{ scale }], top, opacity: 0.85 };
  });

  const thirdStackStyle = useAnimatedStyle(() => {
    const scale = interpolate(entranceProgress.value, [0, 1], [0.88, 0.92]);
    const top = interpolate(entranceProgress.value, [0, 1], [36, 24]);
    return { transform: [{ scale }], top, opacity: 0.5 };
  });

  const fourthStackStyle = useAnimatedStyle(() => {
    const scale = interpolate(entranceProgress.value, [0, 1], [0.84, 0.88]);
    const top = interpolate(entranceProgress.value, [0, 1], [48, 36]);
    return { transform: [{ scale }], top, opacity: 0 };
  });

  // Main card entrance — animate from stack position to full size (no opacity to avoid bleed-through)
  const mainEntranceStyle = useAnimatedStyle(() => {
    const scale = interpolate(entranceProgress.value, [0, 1], [0.96, 1]);
    const translateYEntrance = interpolate(entranceProgress.value, [0, 1], [12, 0]);
    return {
      transform: [{ scale }, { translateY: translateYEntrance }],
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
    stackCard: { width: cardWidth },
    card: { width: cardWidth },
  }), [cardWidth]);

  return (
    <View style={styles.wrapper}>
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
                style={[styles.frontStatement, { color: colors.textPrimary }]}
                numberOfLines={8}
                adjustsFontSizeToFit
                minimumFontScale={0.65}
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
          style={[
            styles.card,
            dynamicStyles.card,
            mainEntranceStyle,
            cardDragStyle,
          ]}
        >
          {/* ---- FRONT FACE ---- */}
          <Animated.View style={[styles.faceOuter, frontFaceStyle]}>
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
              <View
                style={[
                  styles.categoryBadge,
                  { backgroundColor: colors.primary + '12' },
                ]}
              >
                <Text style={[styles.category, { color: colors.primary }]}>
                  {categoryName}
                </Text>
              </View>

              <Text
                style={[styles.statementQuote, { color: colors.primary }]}
              >
                &laquo;
              </Text>
              <Text
                style={[
                  styles.frontStatement,
                  { color: colors.textPrimary },
                ]}
                numberOfLines={8}
                adjustsFontSizeToFit
                minimumFontScale={0.65}
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
          <Animated.View style={[styles.backFaceOuter, backFaceStyle]}>
            <View
              style={[styles.faceInner, { backgroundColor: colors.surface, borderRadius: borderRadius.xxl, ...elevation.lg }]}
            >
            {activeFeedback && (
              <>
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
                </LinearGradient>

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
            </View>
          </Animated.View>
        </Animated.View>
      </GestureDetector>
    </View>
  );
};

export const FlipSwipeCard = React.memo(FlipSwipeCardInner);

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
  },
  faceOuter: {
    width: '100%',
    minHeight: 300,
  },
  backFaceOuter: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
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
  // Back face styles
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
