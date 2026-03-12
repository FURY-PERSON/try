import React, { useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, useWindowDimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  interpolate,
  Easing,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { fontFamily } from '@/theme/typography';
import type { FC } from 'react';
import { s } from '@/utils/scale';

type SwipeHintOverlayProps = {
  variant: 'answer' | 'continue';
  visible: boolean;
  onDismiss: () => void;
};

export const SwipeHintOverlay: FC<SwipeHintOverlayProps> = ({
  variant,
  visible,
  onDismiss,
}) => {
  const { t } = useTranslation();
  const { width: screenWidth } = useWindowDimensions();
  const handX = useSharedValue(0);

  const swipeDistance = screenWidth * 0.25;

  useEffect(() => {
    if (visible) {
      handX.value = 0;
      handX.value = withDelay(
        400,
        withRepeat(
          withSequence(
            withTiming(swipeDistance, { duration: 600, easing: Easing.inOut(Easing.ease) }),
            withTiming(0, { duration: 400, easing: Easing.inOut(Easing.ease) }),
            withTiming(-swipeDistance, { duration: 600, easing: Easing.inOut(Easing.ease) }),
            withTiming(0, { duration: 400, easing: Easing.inOut(Easing.ease) }),
          ),
          -1,
        ),
      );
    }
  }, [visible, swipeDistance, handX]);

  const handStyle = useAnimatedStyle(() => {
    // Tilt finger slightly in the direction of movement
    const rotation = interpolate(handX.value, [-swipeDistance, 0, swipeDistance], [-15, 0, 15]);
    return {
      transform: [{ translateX: handX.value }, { rotate: `${rotation}deg` }],
    };
  });

  if (!visible) return null;

  const hintText =
    variant === 'answer'
      ? t('game.swipeHintAnswer')
      : t('game.swipeHintContinue');

  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(200)}
      style={styles.overlay}
    >
      <Pressable style={styles.backdrop} onPress={onDismiss}>
        <View style={styles.content}>
          <Animated.View style={[styles.hand, handStyle]}>
            <Text style={styles.fingerEmoji}>{'👆'}</Text>
          </Animated.View>

          <Text style={styles.hintText}>{hintText}</Text>

          <View style={styles.button}>
            <Text style={styles.buttonText}>{t('game.gotIt')}</Text>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    gap: s(24),
    marginTop: s(160)
  },
  hand: {
    marginBottom: s(8),
  },
  fingerEmoji: {
    fontSize: s(64),
  },
  hintText: {
    fontSize: s(20),
    fontFamily: fontFamily.bold,
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: s(28),
  },
  button: {
    paddingHorizontal: s(32),
    paddingVertical: s(12),
    borderRadius: s(24),
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  buttonText: {
    fontSize: s(16),
    fontFamily: fontFamily.semiBold,
    color: '#FFFFFF',
  },
});
