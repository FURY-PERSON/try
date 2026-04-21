import React, { useEffect, useMemo, useCallback, useRef } from 'react';
import { View, Text, Platform, StyleSheet, useWindowDimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
  interpolate,
  Extrapolation,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeContext } from '@/theme';
import { fontFamily } from '@/theme/typography';
import { useTranslation } from 'react-i18next';
import type { FC } from 'react';
import type { SwipeDirection } from '../types';
import { s } from '@/utils/scale';

// Static gradient point objects
const GRADIENT_START = { x: 0, y: 0 } as const;
const GRADIENT_END_H = { x: 1, y: 0 } as const;

type SwipeCardProps = {
  statement: string;
  categoryName: string;
  cardIndex: number;
  totalCards: number;
  onSwipe: (direction: SwipeDirection) => void;
  disabled?: boolean;
  nextStatement?: string;
  nextCategoryName?: string;
};

const SwipeCardInner: FC<SwipeCardProps> = ({
  statement,
  categoryName,
  cardIndex,
  totalCards,
  onSwipe,
  disabled = false,
  nextStatement,
  nextCategoryName,
}) => {
  const { colors, borderRadius, elevation, gradients } = useThemeContext();
  const { t } = useTranslation();
  const { width: screenWidth } = useWindowDimensions();
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const isDisabledShared = useSharedValue(disabled);

  const SWIPE_THRESHOLD = useMemo(() => screenWidth * 0.25, [screenWidth]);
  const CARD_WIDTH = useMemo(() => screenWidth - 48, [screenWidth]);

  // Sync disabled prop to shared value
  useEffect(() => {
    isDisabledShared.value = disabled;
  }, [disabled, isDisabledShared]);

  // Reset position when card changes
  useEffect(() => {
    translateX.value = 0;
    translateY.value = 0;
  }, [cardIndex, translateX, translateY]);

  // Stable callback ref to avoid gesture recreation
  const onSwipeRef = useRef(onSwipe);
  onSwipeRef.current = onSwipe;
  const callOnSwipe = useCallback((direction: SwipeDirection) => {
    onSwipeRef.current(direction);
  }, []);

  // Memoize gesture to prevent native handler re-attach on every render
  const gesture = useMemo(() => Gesture.Pan()
    .activeOffsetX([-15, 15])
    .onUpdate((event) => {
      if (isDisabledShared.value) return;
      translateX.value = event.translationX;
      translateY.value = event.translationY * 0.3;
    })
    .onEnd((event) => {
      if (isDisabledShared.value) return;
      if (event.translationX > SWIPE_THRESHOLD) {
        translateX.value = withTiming(screenWidth * 1.5, { duration: 300 });
        runOnJS(callOnSwipe)('right');
      } else if (event.translationX < -SWIPE_THRESHOLD) {
        translateX.value = withTiming(-screenWidth * 1.5, { duration: 300 });
        runOnJS(callOnSwipe)('left');
      } else {
        translateX.value = withTiming(0, { duration: 220, easing: Easing.out(Easing.cubic) });
        translateY.value = withTiming(0, { duration: 220, easing: Easing.out(Easing.cubic) });
      }
    }), [SWIPE_THRESHOLD, screenWidth, callOnSwipe]);

  const HALF_SCREEN = screenWidth / 2;

  const cardStyle = useAnimatedStyle(() => {
    'worklet';
    const rotation = interpolate(
      translateX.value,
      [-HALF_SCREEN, 0, HALF_SCREEN],
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

  const cardGlowStyle = useAnimatedStyle(() => {
    'worklet';
    const progress = interpolate(
      translateX.value,
      [-SWIPE_THRESHOLD, 0, SWIPE_THRESHOLD],
      [-1, 0, 1],
      Extrapolation.CLAMP,
    );
    const absProgress = progress < 0 ? -progress : progress;
    const opacity = absProgress * 0.19;
    const isRight = progress > 0;
    const r = isRight ? 16 : 239;
    const g = isRight ? 185 : 68;
    const b = isRight ? 129 : 68;
    return {
      borderColor: `rgba(${r}, ${g}, ${b}, ${opacity})`,
      borderWidth: 2,
    };
  });

  const factOverlayStyle = useAnimatedStyle(() => {
    'worklet';
    return {
      opacity: interpolate(
        translateX.value,
        [0, SWIPE_THRESHOLD],
        [0, 1],
        Extrapolation.CLAMP,
      ),
    };
  });

  const fakeOverlayStyle = useAnimatedStyle(() => {
    'worklet';
    return {
      opacity: interpolate(
        translateX.value,
        [-SWIPE_THRESHOLD, 0],
        [1, 0],
        Extrapolation.CLAMP,
      ),
    };
  });

  const remainingCards = totalCards - cardIndex;

  // Memoize dynamic styles that depend on dimensions
  const dynamicStyles = useMemo(() => ({
    stackCard: { width: CARD_WIDTH },
    card: { width: CARD_WIDTH },
  }), [CARD_WIDTH]);

  return (
    <View style={styles.wrapper}>
      {/* Third card in stack — empty placeholder */}
      {remainingCards > 2 && (
        <View
          style={[
            styles.stackCard,
            dynamicStyles.stackCard,
            {
              backgroundColor: colors.surface,
              borderRadius: borderRadius.xxl,
              borderWidth: 1,
              borderColor: colors.border,
              transform: [{ scale: 0.92 }],
              top: 24,
              opacity: 0.4,
            },
          ]}
        />
      )}

      {/* Second card in stack — shows next question content */}
      {remainingCards > 1 && (
        <View
          style={[
            styles.stackCard,
            dynamicStyles.stackCard,
            {
              backgroundColor: colors.surface,
              borderRadius: borderRadius.xxl,
              borderWidth: 1,
              borderColor: colors.border,
              transform: [{ scale: 0.96 }],
              top: 12,
              opacity: 0.85,
              overflow: 'hidden',
            },
          ]}
        >
          <LinearGradient
            colors={gradients.primary}
            start={GRADIENT_START}
            end={GRADIENT_END_H}
            style={[styles.topAccent, { borderTopLeftRadius: borderRadius.xxl, borderTopRightRadius: borderRadius.xxl }]}
          />
          {nextStatement ? (
            <View style={styles.stackContent}>
              {nextCategoryName ? (
                <View style={[styles.categoryBadge, { backgroundColor: colors.primary + '12' }]}>
                  <Text style={[styles.category, { color: colors.primary }]}>
                    {nextCategoryName}
                  </Text>
                </View>
              ) : null}
              <Text style={[styles.statementQuote, { color: colors.primary }]}>«</Text>
              <Text style={[styles.statement, { color: colors.textPrimary }]} numberOfLines={3}>
                {nextStatement}
              </Text>
              <Text style={[styles.statementQuote, styles.quoteEnd, { color: colors.primary }]}>»</Text>
            </View>
          ) : null}
        </View>
      )}

      {/* Main interactive card */}
      <GestureDetector gesture={gesture}>
        <Animated.View
          renderToHardwareTextureAndroid
          style={[
            styles.card,
            dynamicStyles.card,
            {
              backgroundColor: colors.surface,
              borderRadius: borderRadius.xxl,
              ...elevation.lg,
            },
            cardStyle,
            cardGlowStyle,
          ]}
        >
          <LinearGradient
            colors={gradients.primary}
            start={GRADIENT_START}
            end={GRADIENT_END_H}
            style={[styles.topAccent, { borderTopLeftRadius: borderRadius.xxl, borderTopRightRadius: borderRadius.xxl }]}
          />

          <Animated.View
            style={[
              styles.overlay,
              styles.factOverlay,
              { backgroundColor: colors.emerald, borderRadius: borderRadius.sm },
              factOverlayStyle,
            ]}
          >
            <Text style={styles.overlayText}>{t('game.fact')}</Text>
          </Animated.View>

          <Animated.View
            style={[
              styles.overlay,
              styles.fakeOverlay,
              { backgroundColor: colors.red, borderRadius: borderRadius.sm },
              fakeOverlayStyle,
            ]}
          >
            <Text style={styles.overlayText}>{t('game.fake')}</Text>
          </Animated.View>

          <View style={styles.cardContent}>
            <View style={[styles.categoryBadge, { backgroundColor: colors.primary + '12' }]}>
              <Text style={[styles.category, { color: colors.primary }]}>
                {categoryName}
              </Text>
            </View>

            <Text style={[styles.statementQuote, { color: colors.primary }]}>«</Text>
            <Text style={[styles.statement, { color: colors.textPrimary }]}>
              {statement}
            </Text>
            <Text style={[styles.statementQuote, styles.quoteEnd, { color: colors.primary }]}>»</Text>
          </View>
        </Animated.View>
      </GestureDetector>
    </View>
  );
};

export const SwipeCard = React.memo(SwipeCardInner);

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
    minHeight: s(300),
    ...Platform.select({
      ios: { overflow: 'hidden' as const },
      android: {  overflow: 'hidden' as const},
    }),
  },
  topAccent: {
    height: s(3),
    width: '100%',
  },
  cardContent: {
    paddingHorizontal: s(24),
    paddingVertical: s(32),
    flex: 1,
    justifyContent: 'center',
  },
  stackContent: {
    paddingHorizontal: s(24),
    paddingVertical: s(24),
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
  statement: {
    fontSize: s(22),
    fontFamily: fontFamily.bold,
    lineHeight: s(32),
    textAlign: 'center',
  },
});
