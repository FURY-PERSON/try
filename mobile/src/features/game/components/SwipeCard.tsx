import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
  Extrapolation,
  interpolateColor,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeContext } from '@/theme';
import { fontFamily } from '@/theme/typography';
import { useTranslation } from 'react-i18next';
import type { FC } from 'react';
import type { SwipeDirection } from '../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25;

type SwipeCardProps = {
  statement: string;
  categoryName: string;
  cardIndex: number;
  totalCards: number;
  onSwipe: (direction: SwipeDirection) => void;
  disabled?: boolean;
};

export const SwipeCard: FC<SwipeCardProps> = ({
  statement,
  categoryName,
  cardIndex,
  totalCards,
  onSwipe,
  disabled = false,
}) => {
  const { colors, borderRadius, elevation, gradients } = useThemeContext();
  const { t } = useTranslation();
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  const handleSwipe = (direction: SwipeDirection) => {
    onSwipe(direction);
  };

  const gesture = Gesture.Pan()
    .enabled(!disabled)
    .onUpdate((event) => {
      translateX.value = event.translationX;
      translateY.value = event.translationY * 0.3;
    })
    .onEnd((event) => {
      if (event.translationX > SWIPE_THRESHOLD) {
        translateX.value = withTiming(SCREEN_WIDTH * 1.5, { duration: 300 });
        runOnJS(handleSwipe)('right');
      } else if (event.translationX < -SWIPE_THRESHOLD) {
        translateX.value = withTiming(-SCREEN_WIDTH * 1.5, { duration: 300 });
        runOnJS(handleSwipe)('left');
      } else {
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
      }
    });

  const cardStyle = useAnimatedStyle(() => {
    const rotation = interpolate(
      translateX.value,
      [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
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

  // Glow effect based on swipe direction
  const cardGlowStyle = useAnimatedStyle(() => {
    const glowColor = interpolateColor(
      translateX.value,
      [-SWIPE_THRESHOLD, 0, SWIPE_THRESHOLD],
      [colors.red + '30', 'transparent', colors.emerald + '30'],
    );
    return {
      borderColor: glowColor,
      borderWidth: 2,
    };
  });

  const factOverlayStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      translateX.value,
      [0, SWIPE_THRESHOLD],
      [0, 1],
      Extrapolation.CLAMP,
    );
    return { opacity };
  });

  const fakeOverlayStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      translateX.value,
      [-SWIPE_THRESHOLD, 0],
      [1, 0],
      Extrapolation.CLAMP,
    );
    return { opacity };
  });

  // Stack cards behind
  const stackCard1Style = {
    transform: [{ scale: 0.95 }, { translateY: 8 }],
    opacity: 0.6,
  };
  const stackCard2Style = {
    transform: [{ scale: 0.9 }, { translateY: 16 }],
    opacity: 0.3,
  };

  return (
    <View style={styles.wrapper}>
      {/* Background stack cards */}
      {cardIndex + 2 < totalCards && (
        <View
          style={[
            styles.stackCard,
            styles.card,
            {
              backgroundColor: colors.surface,
              borderRadius: borderRadius.xxl,
              borderWidth: 1,
              borderColor: colors.border,
            },
            stackCard2Style,
          ]}
        />
      )}
      {cardIndex + 1 < totalCards && (
        <View
          style={[
            styles.stackCard,
            styles.card,
            {
              backgroundColor: colors.surface,
              borderRadius: borderRadius.xxl,
              borderWidth: 1,
              borderColor: colors.border,
            },
            stackCard1Style,
          ]}
        />
      )}

      {/* Main card */}
      <GestureDetector gesture={gesture}>
        <Animated.View
          style={[
            styles.card,
            {
              backgroundColor: colors.surface,
              borderRadius: borderRadius.xxl,
              ...elevation.lg,
            },
            cardStyle,
            cardGlowStyle,
          ]}
        >
          {/* Decorative top gradient line */}
          <LinearGradient
            colors={gradients.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
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
            <Text style={[styles.counter, { color: colors.textTertiary }]}>
              {cardIndex + 1} / {totalCards}
            </Text>

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

            <View style={styles.swipeHints}>
              <View style={[styles.hintBadge, { backgroundColor: colors.red + '10', borderWidth: 1, borderColor: colors.red + '20' }]}>
                <Text style={[styles.hintText, { color: colors.red }]}>
                  ← {t('game.fake')}
                </Text>
              </View>
              <View style={[styles.hintBadge, { backgroundColor: colors.emerald + '10', borderWidth: 1, borderColor: colors.emerald + '20' }]}>
                <Text style={[styles.hintText, { color: colors.emerald }]}>
                  {t('game.fact')} →
                </Text>
              </View>
            </View>
          </View>
        </Animated.View>
      </GestureDetector>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stackCard: {
    position: 'absolute',
    width: SCREEN_WIDTH - 48,
    minHeight: 300,
  },
  card: {
    width: SCREEN_WIDTH - 48,
    minHeight: 300,
    overflow: 'hidden',
  },
  topAccent: {
    height: 3,
    width: '100%',
  },
  cardContent: {
    padding: 28,
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
  counter: {
    fontSize: 12,
    fontFamily: fontFamily.medium,
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  categoryBadge: {
    alignSelf: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 9999,
    marginBottom: 24,
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
  statement: {
    fontSize: 22,
    fontFamily: fontFamily.bold,
    lineHeight: 32,
    textAlign: 'center',
  },
  swipeHints: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 32,
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
});
