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
} from 'react-native-reanimated';
import { useThemeContext } from '@/theme';
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
  const { colors, borderRadius, elevation } = useThemeContext();
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

  return (
    <View style={styles.wrapper}>
      <GestureDetector gesture={gesture}>
        <Animated.View
          style={[
            styles.card,
            {
              backgroundColor: colors.surface,
              borderRadius: borderRadius.xxl,
              ...elevation.md,
            },
            cardStyle,
          ]}
        >
          <Animated.View
            style={[
              styles.overlay,
              styles.factOverlay,
              { borderColor: colors.primary, backgroundColor: colors.primary + '18' },
              factOverlayStyle,
            ]}
          >
            <Text style={[styles.overlayText, { color: colors.primary }]}>{t('game.fact')}</Text>
          </Animated.View>

          <Animated.View
            style={[
              styles.overlay,
              styles.fakeOverlay,
              { borderColor: colors.red, backgroundColor: colors.red + '18' },
              fakeOverlayStyle,
            ]}
          >
            <Text style={[styles.overlayText, { color: colors.red }]}>{t('game.fake')}</Text>
          </Animated.View>

          <Text style={[styles.counter, { color: colors.textTertiary }]}>
            {cardIndex + 1} / {totalCards}
          </Text>

          <Text style={[styles.category, { color: colors.blue }]}>
            {categoryName}
          </Text>

          <Text style={[styles.statement, { color: colors.textPrimary }]}>
            {statement}
          </Text>

          <View style={styles.swipeHints}>
            <View style={[styles.hintBadge, { backgroundColor: colors.red + '12' }]}>
              <Text style={[styles.hintText, { color: colors.red }]}>
                ← {t('game.fake')}
              </Text>
            </View>
            <View style={[styles.hintBadge, { backgroundColor: colors.primary + '12' }]}>
              <Text style={[styles.hintText, { color: colors.primary }]}>
                {t('game.fact')} →
              </Text>
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
  card: {
    width: SCREEN_WIDTH - 48,
    minHeight: 300,
    padding: 28,
    justifyContent: 'center',
  },
  overlay: {
    position: 'absolute',
    top: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 2,
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
    fontFamily: 'Nunito_700Bold',
  },
  counter: {
    fontSize: 13,
    fontFamily: 'Nunito_500Medium',
    textAlign: 'center',
    marginBottom: 8,
  },
  category: {
    fontSize: 13,
    fontFamily: 'Nunito_600SemiBold',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 24,
  },
  statement: {
    fontSize: 22,
    fontFamily: 'Nunito_700Bold',
    lineHeight: 32,
    textAlign: 'center',
  },
  swipeHints: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 32,
  },
  hintBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  hintText: {
    fontSize: 13,
    fontFamily: 'Nunito_600SemiBold',
  },
});
